import uuid
import json
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.config import settings
from app.models.user import User, UserCondition
from app.models.diet_plan import DietPlan
from app.models.ai_session import AIChatSession
from app.models.food import Food
from app.engines.ai_layer import chat, stream_chat, explain_meal_plan, explain_food, SUGGESTED_QUESTIONS
from app.schemas.ai import ChatRequest, ChatResponse, ExplainFoodRequest, ExplainFoodResponse

router = APIRouter(prefix="/ai", tags=["ai"])


def _get_anthropic_client():
    try:
        import anthropic
        return anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    except Exception:
        return None


async def _get_user_context(user_id: uuid.UUID, db: AsyncSession) -> tuple[User, dict, list[str]]:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    cond_result = await db.execute(
        select(UserCondition).join(UserCondition.condition).where(UserCondition.user_id == user_id)
    )
    user_conditions = cond_result.scalars().all()
    condition_codes = [getattr(uc.condition, "code", "") for uc in user_conditions]
    condition_names = [getattr(uc.condition, "name", "") for uc in user_conditions]

    user_context = {
        "name": user.name,
        "age": user.age,
        "gender": user.gender,
        "weight_kg": user.weight_kg,
        "height_cm": user.height_cm,
        "activity_level": user.activity_level,
        "conditions": condition_names,
    }
    return user, user_context, condition_codes


@router.post("/{user_id}/chat", response_model=ChatResponse)
async def chat_endpoint(
    user_id: uuid.UUID,
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    user, user_context, condition_codes = await _get_user_context(user_id, db)
    client = _get_anthropic_client()
    if not client or not settings.anthropic_api_key:
        return ChatResponse(
            session_id=body.session_id or uuid.uuid4(),
            response="AI chat requires an Anthropic API key. Please configure ANTHROPIC_API_KEY.",
            suggested_questions=SUGGESTED_QUESTIONS[:4],
        )

    # Load or create session
    session = None
    if body.session_id:
        result = await db.execute(
            select(AIChatSession).where(
                AIChatSession.id == body.session_id,
                AIChatSession.user_id == user_id,
            )
        )
        session = result.scalar_one_or_none()

    if not session:
        session = AIChatSession(
            user_id=user_id,
            messages=[],
            context_snapshot=user_context,
        )
        db.add(session)
        await db.flush()

    conversation_history = session.messages or []
    response_text = await chat(client, body.message, conversation_history, user_context, None, condition_codes)

    # Append to history
    updated_messages = list(conversation_history) + [
        {"role": "user", "content": body.message},
        {"role": "assistant", "content": response_text},
    ]
    session.messages = updated_messages
    await db.commit()

    return ChatResponse(
        session_id=session.id,
        response=response_text,
        suggested_questions=SUGGESTED_QUESTIONS[:4],
    )


@router.get("/{user_id}/chat/stream")
async def stream_chat_endpoint(
    user_id: uuid.UUID,
    message: str,
    session_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    user, user_context, condition_codes = await _get_user_context(user_id, db)
    client = _get_anthropic_client()

    if not client or not settings.anthropic_api_key:
        async def fallback():
            yield "data: AI chat requires ANTHROPIC_API_KEY to be configured.\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(fallback(), media_type="text/event-stream")

    async def generate():
        async for chunk in stream_chat(client, message, [], user_context, None, condition_codes):
            escaped = chunk.replace("\n", "\\n")
            yield f"data: {escaped}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/{user_id}/explain/meal/{plan_id}")
async def explain_plan(
    user_id: uuid.UUID,
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    user, user_context, condition_codes = await _get_user_context(user_id, db)
    plan = await db.get(DietPlan, plan_id)
    if not plan or plan.user_id != user_id:
        raise HTTPException(status_code=404, detail="Plan not found")

    client = _get_anthropic_client()
    if not client or not settings.anthropic_api_key:
        return {"explanation": "AI explanation requires ANTHROPIC_API_KEY to be configured."}

    plan_summary = {
        "plan_date": plan.plan_date.isoformat(),
        "total_calories": plan.total_calories,
        "total_protein_g": plan.total_protein_g,
        "total_carbs_g": plan.total_carbs_g,
        "total_fat_g": plan.total_fat_g,
        "conditions_accounted_for": condition_codes,
    }

    explanation = await explain_meal_plan(client, user_context, plan_summary, condition_codes, [])

    # Cache in plan
    plan.ai_summary = explanation
    await db.commit()

    return {"explanation": explanation}


@router.post("/{user_id}/explain/food/{food_id}")
async def explain_food_endpoint(
    user_id: uuid.UUID,
    food_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    user, user_context, condition_codes = await _get_user_context(user_id, db)
    food = await db.get(Food, food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")

    client = _get_anthropic_client()
    if not client or not settings.anthropic_api_key:
        return ExplainFoodResponse(
            food_name=food.name,
            explanation="AI explanation requires ANTHROPIC_API_KEY to be configured.",
            reason_tags=[],
        )

    from app.engines.health_rules import HealthRulesEngine
    rules_engine = HealthRulesEngine()
    constraints = await rules_engine.get_user_constraints(user_id, db)
    ev = rules_engine.evaluate_food(food, constraints)

    explanation = await explain_food(client, food.name, ev.positive_tags, condition_codes, user_context)
    return ExplainFoodResponse(
        food_name=food.name,
        explanation=explanation,
        reason_tags=ev.positive_tags,
    )
