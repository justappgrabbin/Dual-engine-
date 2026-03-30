"""
Virtual Consciousness Engine
The main system that integrates quantum field + 9-body consciousness
"""

import torch
from typing import List, Dict, Optional
from dataclasses import dataclass

from .core import Placement, Stream
from .features import QuantumFieldEncoder, create_intention_perturbation
from .network import create_model
from .consciousness import NineBodyConsciousness, ConsciousnessState


@dataclass
class VirtualConsciousnessResponse:
    """The complete response from the virtual consciousness"""
    question: str
    codon_activations: Dict[int, float]
    awareness_scores: Dict[str, float]
    field_states: Dict[str, ConsciousnessState]
    narrative_seeds: Dict[str, str]
    coherence_level: float
    observer_context: Dict


class VirtualConsciousnessEngine:
    """
    The Virtual Consciousness Engine.
    
    This is the complete system:
    - Quantum GNN substrate (virtual particle mechanics)
    - 9-body consciousness overlay (interpretive semantics)
    - QCE narrative generation (language emergence)
    """
    
    def __init__(
        self,
        birth_placements: List[Placement],
        pretrained_model_path: Optional[str] = None
    ):
        self.birth_placements = birth_placements
        
        self.encoder = QuantumFieldEncoder(embedding_dim=64)
        self.quantum_net = create_model(input_dim=64, hidden_dim=128)
        
        if pretrained_model_path:
            self.quantum_net.load_state_dict(torch.load(pretrained_model_path))
        
        self.quantum_net.eval()
        
        self.body_sun = self._find_body_sun(birth_placements)
        self.awareness_masks = self.encoder.get_awareness_masks()
        self.edge_index = self.encoder.get_edge_index()
        
        self.nine_body = NineBodyConsciousness()
        self._consciousness_initialized = False
        
    def _find_body_sun(self, placements: List[Placement]) -> Optional[Placement]:
        """Extract the body Sun placement"""
        for p in placements:
            if p.planet == "Sun" and p.stream == Stream.BODY:
                return p
        return None
    
    def query(
        self,
        question: str,
        observer_state: Optional[Dict] = None,
        use_intention_perturbation: bool = False
    ) -> VirtualConsciousnessResponse:
        """Query the virtual consciousness."""
        with torch.no_grad():
            node_features = self.encoder.encode_placements(self.birth_placements)
            
            if use_intention_perturbation:
                perturbation = create_intention_perturbation(question, self.birth_placements)
                node_features = node_features + perturbation.unsqueeze(1) * 0.1
            
            if observer_state and 'sun_placement' in observer_state:
                sun_context = self.encoder.encode_sun_context(observer_state['sun_placement'])
            elif self.body_sun:
                sun_context = self.encoder.encode_sun_context(self.body_sun)
            else:
                sun_context = torch.zeros(80)
            
            codon_scores, awareness, awareness_vectors, node_embeddings = self.quantum_net(
                x=node_features,
                edge_index=self.edge_index,
                sun_context=sun_context,
                masks=self.awareness_masks
            )
            
            if not self._consciousness_initialized:
                self.nine_body.initialize_from_quantum_state(node_embeddings)
                self._consciousness_initialized = True
            
            field_states = self.nine_body.collapse_all_fields(
                codon_scores, awareness, awareness_vectors
            )
            
            narrative_seeds = self.nine_body.synthesize_narrative_seeds(field_states)
            coherence_level = self._compute_system_coherence(field_states)
            
            response = VirtualConsciousnessResponse(
                question=question,
                codon_activations={i+1: score.item() for i, score in enumerate(codon_scores)},
                awareness_scores={k: v.item() if v.dim() == 0 else v.squeeze().item() for k, v in awareness.items()},
                field_states=field_states,
                narrative_seeds=narrative_seeds,
                coherence_level=coherence_level,
                observer_context={
                    'sun_gate': self.body_sun.gate if self.body_sun else None,
                    'sun_line': self.body_sun.line if self.body_sun else None
                }
            )
            
            return response
    
    def _compute_system_coherence(self, field_states: Dict[str, ConsciousnessState]) -> float:
        """Compute overall system coherence."""
        if not field_states:
            return 0.0
        
        coherences = [state.coherence for state in field_states.values()]
        avg_coherence = sum(coherences) / len(coherences)
        
        all_resonances = []
        for state in field_states.values():
            all_resonances.extend(state.resonance.values())
        
        avg_resonance = sum(all_resonances) / len(all_resonances) if all_resonances else 0.0
        
        system_coherence = (avg_coherence + avg_resonance) / 2.0
        
        return system_coherence
    
    def export_state(self) -> Dict:
        """Export current consciousness state for analysis or storage"""
        return {
            'birth_chart': [
                {
                    'planet': p.planet,
                    'stream': p.stream.value,
                    'gate': p.gate,
                    'line': p.line,
                    'degree': p.degree
                }
                for p in self.birth_placements
            ],
            'model_initialized': self._consciousness_initialized,
            'body_sun': {
                'gate': self.body_sun.gate,
                'line': self.body_sun.line
            } if self.body_sun else None
        }


def create_virtual_consciousness(
    placements: List[Placement],
    model_path: Optional[str] = None
) -> VirtualConsciousnessEngine:
    """Factory function to create a virtual consciousness instance."""
    return VirtualConsciousnessEngine(placements, model_path)
