"""
AI Layer — Claude API integration for explanations and Q&A chat.
All recommendation logic stays in Python engines; Claude only explains and converses.
"""
from __future__ import annotations

import json
from typing import AsyncIterator

MEDICAL_DISCLAIMER = (
    "\n\n---\n*This is educational information, not medical advice. "
    "Always consult your healthcare provider before making changes to your diet, "
    "exercise, or lifestyle.*"
)

SYSTEM_PROMPT_TEMPLATE = """You are HealthCopilot — an empathetic, evidence-based personal health advisor powered by AI.
Your role is to help users understand their personalized nutrition, exercise, and lifestyle plan.

CRITICAL RULES:
- You are an AI assistant, NOT a medical doctor. Never claim to diagnose, treat, or prescribe.
- Every response must end with the disclaimer: "This is educational information, not medical advice."
- Be warm, specific, and encouraging. Avoid generic platitudes.
- Ground every explanation in the user's specific conditions and plan data below.
- If asked about drug interactions, clinical diagnoses, or medication, defer to their healthcare provider.
- Never override the algorithmically computed recommendations — only explain them.

USER PROFILE:
{user_context}

TODAY'S PLAN SUMMARY:
{plan_summary}

ACTIVE HEALTH CONDITIONS:
{conditions}

HEALTH RULES APPLIED:
{rules_applied}
"""

SUGGESTED_QUESTIONS = [
    "Why was this food recommended for me?",
    "What should I avoid and why?",
    "Explain my protein target",
    "How does my diet support my health conditions?",
    "What are the best breakfast options for me?",
    "How much water should I drink?",
]


def build_system_prompt(
    user_context: dict,
    plan_summary: dict | None,
    condition_codes: list[str],
    rules_applied: list[dict] | None,
) -> str:
    return SYSTEM_PROMPT_TEMPLATE.format(
        user_context=json.dumps(user_context, indent=2, default=str),
        plan_summary=json.dumps(plan_summary or {}, indent=2, default=str),
        conditions=", ".join(condition_codes) if condition_codes else "None",
        rules_applied=json.dumps(rules_applied or [], indent=2, default=str),
    )


async def explain_meal_plan(
    anthropic_client,
    user_context: dict,
    plan_summary: dict,
    condition_codes: list[str],
    rules_applied: list[dict],
) -> str:
    """Generate a narrative explanation of today's meal plan."""
    try:
        system = build_system_prompt(user_context, plan_summary, condition_codes, rules_applied)
        response = await anthropic_client.messages.create(
            model="claude-opus-4-8",
            max_tokens=800,
            system=system,
            messages=[{
                "role": "user",
                "content": (
                    "Please explain today's meal plan in 2-3 paragraphs. "
                    "Cover: why these foods were chosen for my specific conditions, "
                    "the key nutritional benefits, and one practical tip for the day."
                ),
            }],
        )
        return response.content[0].text + MEDICAL_DISCLAIMER
    except Exception as e:
        return _fallback_plan_explanation(plan_summary, condition_codes)


async def chat(
    anthropic_client,
    message: str,
    conversation_history: list[dict],
    user_context: dict,
    plan_summary: dict | None,
    condition_codes: list[str],
) -> str:
    """Non-streaming chat response."""
    try:
        system = build_system_prompt(user_context, plan_summary, condition_codes, [])
        messages = conversation_history + [{"role": "user", "content": message}]
        response = await anthropic_client.messages.create(
            model="claude-opus-4-8",
            max_tokens=600,
            system=system,
            messages=messages,
        )
        return response.content[0].text + MEDICAL_DISCLAIMER
    except Exception as e:
        return f"I'm having trouble connecting right now. Please try again in a moment.{MEDICAL_DISCLAIMER}"


async def stream_chat(
    anthropic_client,
    message: str,
    conversation_history: list[dict],
    user_context: dict,
    plan_summary: dict | None,
    condition_codes: list[str],
) -> AsyncIterator[str]:
    """Streaming chat — yields text chunks."""
    try:
        system = build_system_prompt(user_context, plan_summary, condition_codes, [])
        messages = conversation_history + [{"role": "user", "content": message}]
        async with anthropic_client.messages.stream(
            model="claude-opus-4-8",
            max_tokens=600,
            system=system,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                yield text
        yield MEDICAL_DISCLAIMER
    except Exception:
        yield f"I'm having trouble connecting right now. Please try again.{MEDICAL_DISCLAIMER}"


async def explain_food(
    anthropic_client,
    food_name: str,
    reason_tags: list[str],
    condition_codes: list[str],
    user_context: dict,
) -> str:
    """Generate detailed explanation for a specific food item."""
    try:
        tags_str = ", ".join(reason_tags) if reason_tags else "generally nutritious"
        conditions_str = ", ".join(condition_codes) if condition_codes else "no specific conditions"

        response = await anthropic_client.messages.create(
            model="claude-opus-4-8",
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": (
                    f"Explain in 2-3 sentences why {food_name} is beneficial for someone "
                    f"with these conditions: {conditions_str}. "
                    f"Key attributes: {tags_str}. Be specific and practical."
                ),
            }],
        )
        return response.content[0].text + MEDICAL_DISCLAIMER
    except Exception:
        tags_str = ", ".join(reason_tags) if reason_tags else "nutritional value"
        return f"{food_name} was selected for its {tags_str}, making it well-suited for your health profile.{MEDICAL_DISCLAIMER}"


def _fallback_plan_explanation(plan_summary: dict, condition_codes: list[str]) -> str:
    """Template-based fallback when AI is unavailable."""
    conditions_str = " and ".join(condition_codes) if condition_codes else "your health goals"
    return (
        f"Your meal plan has been carefully designed to support {conditions_str}. "
        "Each food was selected based on evidence-based nutritional guidelines — "
        "prioritizing foods that work synergistically with your specific health profile. "
        "The macronutrient targets are calibrated to your body metrics and goals. "
        f"\n\n{MEDICAL_DISCLAIMER}"
    )
