from app.main import _parse_mention


class FakeAgent:
    """Minimal stand-in for AgentRow — _parse_mention only reads .name"""
    def __init__(self, name):
        self.name = name


def test_mention_routes_to_matching_agent():
    agents = [FakeAgent("Physio"), FakeAgent("Head Coach"), FakeAgent("Team Manager")]

    agent, rest = _parse_mention("@Physio how's Alex doing?", agents)

    assert agent is not None
    assert agent.name == "Physio"
    assert rest == "how's Alex doing?"


def test_mention_matches_multiword_name_ignoring_spaces():
    agents = [FakeAgent("Head Coach")]

    agent, rest = _parse_mention("@HeadCoach what's the formation?", agents)

    assert agent is not None
    assert agent.name == "Head Coach"


def test_unknown_mention_falls_through_to_full_board():
    agents = [FakeAgent("Physio")]

    agent, rest = _parse_mention("@NotARealAgent hello", agents)

    assert agent is None
    assert rest == "@NotARealAgent hello"


def test_plain_message_with_no_mention_falls_through():
    agents = [FakeAgent("Physio")]

    agent, rest = _parse_mention("What's our injury situation?", agents)

    assert agent is None
    assert rest == "What's our injury situation?"