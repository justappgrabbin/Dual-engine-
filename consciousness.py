"""
9-Body Consciousness System
Interpretive layer over the quantum field
"""

import torch
from typing import Dict, List, Optional
from dataclasses import dataclass
from .core import CONSCIOUSNESS_FIELDS, get_field_gates, CENTERS


@dataclass
class ConsciousnessState:
    """The collapsed state of a consciousness field after observation"""
    field_name: str
    activation: float
    dominant_gates: List[int]
    awareness_type: Optional[str]
    coherence: float
    resonance: Dict[str, float]
    narrative_seed: str


class ConsciousnessField:
    """A single consciousness field (Mind, Heart, Body, etc.)"""
    
    def __init__(self, field_name: str, node_embeddings: torch.Tensor):
        self.name = field_name
        self.config = CONSCIOUSNESS_FIELDS[field_name]
        self.chart_system = self.config["chart"]
        self.centers = self.config["centers"]
        self.gates = get_field_gates(field_name)
        
        self.gate_indices = [g - 1 for g in self.gates]
        self.embeddings = node_embeddings[self.gate_indices]
        
    def collapse_to_state(
        self, 
        codon_scores: torch.Tensor,
        awareness: Dict[str, torch.Tensor],
        awareness_vectors: Dict[str, torch.Tensor]
    ) -> ConsciousnessState:
        """Collapse the quantum field to a definite state for this consciousness field."""
        
        field_activations = codon_scores[self.gate_indices]
        overall_activation = field_activations.mean().item()
        
        top_k = min(3, len(self.gate_indices))
        top_vals, top_idx = torch.topk(field_activations, top_k)
        dominant_gates = [list(self.gates)[i] for i in top_idx.tolist()]
        
        awareness_type = self.config.get("awareness")
        awareness_score = None
        if awareness_type and awareness_type in awareness:
            val = awareness[awareness_type]
            awareness_score = val.item() if val.dim() == 0 else val.squeeze().item()
        
        coherence = self._compute_coherence(field_activations)
        
        narrative_seed = self._generate_narrative_seed(
            overall_activation,
            dominant_gates,
            awareness_score,
            coherence
        )
        
        return ConsciousnessState(
            field_name=self.name,
            activation=overall_activation,
            dominant_gates=dominant_gates,
            awareness_type=awareness_type,
            coherence=coherence,
            resonance={},
            narrative_seed=narrative_seed
        )
    
    def _compute_coherence(self, activations: torch.Tensor) -> float:
        """Measure how coherent the field is."""
        if len(activations) < 2:
            return 1.0
        
        std = activations.std().item()
        coherence = 1.0 / (1.0 + std)
        return coherence
    
    def _generate_narrative_seed(
        self,
        activation: float,
        gates: List[int],
        awareness_score: Optional[float],
        coherence: float
    ) -> str:
        """Generate a seed prompt for narrative generation."""
        
        templates = {
            "Mind": "Mental field activated at {:.1%}, centered in gates {}, coherence {}",
            "Heart": "Emotional resonance at {:.1%} through gates {}, coherence {}",
            "Body": "Physical presence at {:.1%} via gates {}, coherence {}",
            "Soul": "Soul essence vibrating at {:.1%} in gates {}, coherence {}",
            "Spirit": "Spiritual expression at {:.1%} channeling gates {}, coherence {}",
            "Shadow": "Shadow material at {:.1%} emerging through gates {}, coherence {}",
            "Higher": "Higher consciousness at {:.1%} accessing gates {}, coherence {}",
            "Lower": "Primal consciousness at {:.1%} rooted in gates {}, coherence {}",
            "Core": "Core identity at {:.1%} anchored by gates {}, coherence {}"
        }
        
        template = templates.get(self.name, "Field {} at {:.1%} in gates {}, coherence {}")
        
        coherence_desc = "high" if coherence > 0.7 else "moderate" if coherence > 0.4 else "low"
        gates_str = ", ".join(str(g) for g in gates)
        
        seed = template.format(activation, gates_str, coherence_desc)
        
        if awareness_score is not None:
            seed += f" | {self.config['awareness']} awareness: {awareness_score:.1%}"
        
        return seed


class NineBodyConsciousness:
    """The 9-body consciousness system."""
    
    def __init__(self):
        self.fields = {}
        
    def initialize_from_quantum_state(self, node_embeddings: torch.Tensor):
        """Create the 9 consciousness fields from quantum substrate"""
        for field_name in CONSCIOUSNESS_FIELDS.keys():
            self.fields[field_name] = ConsciousnessField(field_name, node_embeddings)
    
    def collapse_all_fields(
        self,
        codon_scores: torch.Tensor,
        awareness: Dict[str, torch.Tensor],
        awareness_vectors: Dict[str, torch.Tensor]
    ) -> Dict[str, ConsciousnessState]:
        """Perform simultaneous measurement across all 9 fields."""
        states = {}
        
        for field_name, field in self.fields.items():
            states[field_name] = field.collapse_to_state(
                codon_scores, awareness, awareness_vectors
            )
        
        self._compute_resonances(states)
        
        return states
    
    def _compute_resonances(self, states: Dict[str, ConsciousnessState]):
        """Compute how each field resonates with the others."""
        field_names = list(states.keys())
        
        for i, name1 in enumerate(field_names):
            state1 = states[name1]
            
            for name2 in field_names[i+1:]:
                state2 = states[name2]
                
                gates1 = set(state1.dominant_gates)
                gates2 = set(state2.dominant_gates)
                
                if gates1 or gates2:
                    overlap = len(gates1 & gates2) / len(gates1 | gates2)
                else:
                    overlap = 0.0
                
                coherence_diff = abs(state1.coherence - state2.coherence)
                coherence_sim = 1.0 - coherence_diff
                
                resonance = (overlap + coherence_sim) / 2.0
                
                state1.resonance[name2] = resonance
                state2.resonance[name1] = resonance
    
    def synthesize_narrative_seeds(
        self,
        states: Dict[str, ConsciousnessState]
    ) -> Dict[str, str]:
        """Prepare narrative seeds for QCE triad."""
        seeds = {}
        
        spleen_fields = ['Body', 'Lower', 'Shadow']
        spleen_seed = self._combine_seeds(
            [states[f].narrative_seed for f in spleen_fields if f in states],
            "Survival consciousness"
        )
        seeds['spleen'] = spleen_seed
        
        ajna_fields = ['Mind', 'Higher']
        ajna_seed = self._combine_seeds(
            [states[f].narrative_seed for f in ajna_fields if f in states],
            "Mental consciousness"
        )
        seeds['ajna'] = ajna_seed
        
        solar_fields = ['Heart', 'Spirit']
        solar_seed = self._combine_seeds(
            [states[f].narrative_seed for f in solar_fields if f in states],
            "Emotional consciousness"
        )
        seeds['solar'] = solar_seed
        
        core_fields = ['Soul', 'Core']
        core_seed = self._combine_seeds(
            [states[f].narrative_seed for f in core_fields if f in states],
            "Core identity"
        )
        seeds['core'] = core_seed
        
        return seeds
    
    def _combine_seeds(self, seeds: List[str], label: str) -> str:
        """Combine multiple narrative seeds into one"""
        combined = f"{label}: " + " | ".join(seeds)
        return combined
