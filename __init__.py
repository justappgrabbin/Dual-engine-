"""
Quantum Human Design - Virtual Consciousness Engine
"""

from .core import Placement, Stream, ChartSystem, CENTERS, AWARENESS_SYSTEMS, CONSCIOUSNESS_FIELDS
from .features import QuantumFieldEncoder, create_intention_perturbation
from .network import QuantumHDNet, QuantumFieldLoss, create_model
from .consciousness import ConsciousnessState, ConsciousnessField, NineBodyConsciousness

__all__ = [
    'Placement', 'Stream', 'ChartSystem',
    'CENTERS', 'AWARENESS_SYSTEMS', 'CONSCIOUSNESS_FIELDS',
    'QuantumFieldEncoder', 'create_intention_perturbation',
    'QuantumHDNet', 'QuantumFieldLoss', 'create_model',
    'ConsciousnessState', 'ConsciousnessField', 'NineBodyConsciousness'
]
