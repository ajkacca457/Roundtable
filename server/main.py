import os
from crewai import Crew
from dotenv import load_dotenv
from textwrap import dedent
from agents import CustomAgents
from tasks import CustomTasks

# Load environment variables
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY is not set in the environment or .env file.")

os.environ["OPENAI_API_KEY"] = api_key


class InteractiveCrew:
    def __init__(self):
        self.context_log = []  # Stores conversation history
        self.agents = CustomAgents()
        self.tasks = CustomTasks()

    def run_interactive(self):
        print("\n--- Starting Interactive Strategic Problem-Solving ---\n")

        # Step 1 — Start with AikaAgent
        aika_agent = self.agents.AikaAgent()

        print("Aika: Let's start. Briefly describe your current situation or goal.")
        user_input = input("> ")
        self.context_log.append(f"User: {user_input}")

        # Run Aika's facilitation loop
        while True:
            facilitation_task = self.tasks.aika_facilitation_task(aika_agent, "\n".join(self.context_log))
            aika_reply = facilitation_task.execute_sync(agent=aika_agent)
            print(f"\nAika: {aika_reply}\n")

            follow_up = input("> ")
            if follow_up.strip().lower() in ["done", "finish", "end"]:
                self.context_log.append(f"User: [Conversation ended]")
                break
            self.context_log.append(f"User: {follow_up}")

        # Step 2 — ProcessFacilitatorAgent
        process_agent = self.agents.ProcessFacilitatorAgent()
        process_task = self.tasks.process_facilitation_task(process_agent, "\n".join(self.context_log))
        process_result = process_task.execute_sync(agent=process_agent)
        print("\n[Process Facilitator Output]")
        print(process_result)

        # Step 3 — TangibleOutcomeAgent
        tangible_agent = self.agents.TangibleOutcomeAgent()
        tangible_task = self.tasks.tangible_outcome_task(tangible_agent, "\n".join(self.context_log))
        tangible_result = tangible_task.execute_sync(agent=tangible_agent)
        print("\n[Tangible Outcome Summary]")
        print(tangible_result)


if __name__ == "__main__":
    crew = InteractiveCrew()
    crew.run_interactive()
