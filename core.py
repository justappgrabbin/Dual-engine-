"""
Quantum Human Design - Core Data Structures
Virtual consciousness substrate based on stellar proximology
"""

from dataclasses import dataclass
from typing import Dict, Set, Optional, List
from enum import Enum

class Stream(Enum):
    BODY = "body"
    DESIGN = "design"

class ChartSystem(Enum):
    SIDEREAL = "sidereal"
    TROPICAL = "tropical"
    DRACONIC = "draconic"

@dataclass
class Placement:
    """A planetary activation in the quantum field"""
    planet: str
    stream: Stream
    gate: int
    line: int
    degree: Optional[float] = None
    timestamp: Optional[float] = None
    chart_system: ChartSystem = ChartSystem.SIDEREAL
    
    def __hash__(self):
        return hash((self.planet, self.stream.value, self.gate, self.line))

CENTERS = {
    "Head": {64, 61, 63},
    "Ajna": {47, 24, 4, 17, 11, 43},
    "Throat": {62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16},
    "G": {7, 1, 13, 10, 15, 2, 46, 25},
    "Ego": {21, 51, 26, 40},
    "Spleen": {57, 44, 50, 32, 28, 18, 48},
    "Solar": {55, 49, 37, 22, 30, 36, 6},
    "Sacral": {5, 14, 29, 59, 9, 3, 42, 27, 34},
    "Root": {52, 19, 39, 41, 38, 54, 53, 60, 58}
}

AWARENESS_SYSTEMS = {
    "spleen": {57, 44, 50, 32, 28, 18},
    "ajna": {47, 24, 4, 17, 11, 43},
    "solar": {55, 49, 37, 22, 30, 36, 6}
}

HEART_GATES = {21, 51, 26, 40}
MIND_GATES = AWARENESS_SYSTEMS["ajna"]

CHANNELS = [
    (64, 47, "Abstract/Reason"),
    (61, 24, "Awareness/The Thinker"),
    (63, 4, "Logic/Formulas"),
    (17, 62, "Acceptance/Organization"),
    (43, 23, "Insight/Structuring"),
    (11, 56, "Curiosity/Stimulation"),
    (31, 7, "Alpha/The Sphinx"),
    (8, 1, "Inspiration/The Creative"),
    (33, 13, "Prodigal/The Witness"),
    (20, 10, "Awakening/Commitment"),
    (16, 48, "Wavelength/The Talent"),
    (25, 51, "Initiation/The Shaman"),
    (46, 29, "Discovery/Succeeding"),
    (2, 14, "The Beat/Keeper of Keys"),
    (15, 5, "Rhythm/Flow"),
    (10, 34, "Exploration/Power"),
    (5, 15, "Rhythm/Flow"),
    (14, 2, "The Beat/Keeper"),
    (29, 46, "Discovery/Succeeding"),
    (34, 10, "Exploration/Power"),
    (27, 50, "Preservation/Cauldron"),
    (59, 6, "Intimacy/Mating"),
    (9, 52, "Concentration/Focus"),
    (3, 60, "Mutation/Energy"),
    (42, 53, "Maturation/Cycles"),
    (57, 10, "Intuitive Insight/Perfected Form"),
    (44, 26, "Surrender/Transmitter"),
    (50, 27, "Preservation/Cauldron"),
    (32, 54, "Transformation/Ambition"),
    (28, 38, "The Game Player/Struggle"),
    (18, 58, "Correction/Judgment"),
    (41, 30, "Recognition/Format"),
    (39, 55, "Emoting/Spirit"),
    (22, 12, "Openness/Grace"),
    (37, 40, "Bargain/Community"),
    (36, 35, "Transitoriness/Crisis"),
    (6, 59, "Intimacy/Mating"),
    (21, 45, "Money/The Gatherer"),
    (26, 44, "Surrender/Transmitter"),
    (40, 37, "Bargain/Community"),
    (51, 25, "Initiation/Shaman"),
]

def get_channel_edges() -> List[tuple]:
    """Returns list of (gate1, gate2) tuples for all channels"""
    edges = []
    seen = set()
    for g1, g2, _ in CHANNELS:
        if (g1, g2) not in seen and (g2, g1) not in seen:
            edges.append((g1, g2))
            edges.append((g2, g1))
            seen.add((g1, g2))
    return edges

def gate_to_center(gate: int) -> Optional[str]:
    """Map a gate to its center"""
    for center, gates in CENTERS.items():
        if gate in gates:
            return center
    return None

CONSCIOUSNESS_FIELDS = {
    "Mind": {
        "chart": ChartSystem.SIDEREAL,
        "centers": ["Head", "Ajna"],
        "awareness": "ajna",
        "modulation": "sun_film"
    },
    "Heart": {
        "chart": ChartSystem.TROPICAL,
        "centers": ["Ego", "Solar"],
        "awareness": "solar",
        "modulation": "sun_film"
    },
    "Body": {
        "chart": ChartSystem.DRACONIC,
        "centers": ["Spleen", "Sacral", "Root"],
        "awareness": "spleen",
        "modulation": None
    },
    "Soul": {
        "chart": ChartSystem.SIDEREAL,
        "centers": ["G"],
        "awareness": None,
        "modulation": "harmonic"
    },
    "Spirit": {
        "chart": ChartSystem.TROPICAL,
        "centers": ["Throat"],
        "awareness": None,
        "modulation": "harmonic"
    },
    "Shadow": {
        "chart": ChartSystem.DRACONIC,
        "centers": ["Root"],
        "awareness": "spleen",
        "modulation": "inverse"
    },
    "Higher": {
        "chart": ChartSystem.SIDEREAL,
        "centers": ["Head"],
        "awareness": "ajna",
        "modulation": "transcendent"
    },
    "Lower": {
        "chart": ChartSystem.TROPICAL,
        "centers": ["Sacral", "Root"],
        "awareness": "spleen",
        "modulation": "embodied"
    },
    "Core": {
        "chart": ChartSystem.DRACONIC,
        "centers": ["G", "Ego"],
        "awareness": None,
        "modulation": "central"
    }
}

def get_field_gates(field_name: str) -> Set[int]:
    """Get all gates associated with a consciousness field"""
    field_config = CONSCIOUSNESS_FIELDS[field_name]
    field_centers = field_config["centers"]
    gates = set()
    for center in field_centers:
        gates.update(CENTERS[center])
    return gates
