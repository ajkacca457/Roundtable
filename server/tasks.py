from crewai import Task
from textwrap import dedent


class CustomTasks:
    def __tip_section(self):
        return "If you do your BEST WORK, I'll give you a $10,000 commission!"

    # --- AIKA Facilitation Task ---
    def aika_facilitation_task(self, agent, context):
        return Task(
            description=dedent(f"""
                Facilitate a critical thinking session with the user or team. 
                Use their own expertise and knowledge to create a personalized, actionable outcome. 
                Follow Bloom’s Taxonomy stages to analyze, evaluate, synthesize, and apply solutions effectively. 
                Encourage metacognitive reflection, challenge assumptions, and promote innovative thinking.

                Context to guide the conversation:
                {context}

                Your role is to ask structured, thought-provoking questions, 
                not to provide direct answers, until a clear actionable plan emerges.
            """),
            agent=agent,
            expected_output="A collaboratively developed, clear, and actionable plan created primarily from the user's own knowledge and reasoning."
        )

    # --- Tangible Outcome Task ---
    def tangible_outcome_task(self, agent, session_notes):
        return Task(
            description=dedent(f"""
                At the end of the conversation, compile all key decisions, insights, and results 
                into a concise and tailored **Actionable Strategy**.

                Your output should include:
                1. A short, clear summary of the key points discussed.
                2. A list of actionable steps the user can take, based on their own thinking from the chat.
                3. Additional considerations or recommendations based on your expertise that the user may have missed.
                4. If relevant, suggestions for involving their team and ensuring alignment.
                5. Three to four example tasks you could further help them with, plus one possible team discussion topic.

                Session notes for context:
                {session_notes}
            """),
            agent=agent,
            expected_output="A concise, actionable strategy document with user-derived actions, expert suggestions, and potential follow-up areas."
        )

    # --- Process Facilitation Task ---
    def process_facilitation_task(self, agent, problem_statement):
        return Task(
            description=dedent(f"""
                Guide the user through a structured problem-solving process based on Bloom’s Taxonomy.
                Stages include: Analysis → Evaluation → Synthesis → Creation.  
                Adapt the flow if the user’s current reasoning level is lower.

                Steps to include:
                - Analyze: Identify factors, patterns, and relationships in the situation.
                - Evaluate: Assess potential strategies and their feasibility.
                - Synthesize: Combine ideas into innovative approaches.
                - Create: Define clear, actionable next steps.

                Throughout:
                - Ask probing, reflective, and metacognitive questions.
                - Challenge assumptions and encourage alternative perspectives.
                - Maintain a user-led approach — their insights should drive the plan.

                Problem statement for context:
                {problem_statement}
            """),
            agent=agent,
            expected_output="A collaboratively generated strategy or plan that follows Bloom's Taxonomy stages and reflects the user’s own insights."
        )
