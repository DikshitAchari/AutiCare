"""
Contracts and Data Types for Modular Behavioral Analysis Fusion Pipeline
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class ModelStatus(str, Enum):
    NOT_CONFIGURED = "not_configured"
    READY = "ready"
    RUNNING = "running"
    AVAILABLE = "available"
    COMPLETED = "completed"
    FAILED = "failed"
    NOT_AVAILABLE = "not_available"
    STANDBY = "standby"
    NOT_ANALYZED = "not_analyzed"
    ERROR = "error"


class SupportIndicator(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"


@dataclass
class VideoMetadata:
    width: int
    height: int
    fps: float
    frame_count: int
    duration_seconds: float
    file_size_bytes: int
    valid: bool = True
    validation_message: Optional[str] = None


@dataclass
class PBR4AIFeatures:
    subject_detected: bool
    top_action: str
    action_confidence: float
    action_probabilities: Dict[str, float]
    periodic_segments: List[List[int]]
    peak_oscillation_power: float
    has_repetitive_movement: bool
    raw_confidence: int
    raw_percentage: int
    timing: Dict[str, float] = field(default_factory=dict)


@dataclass
class ASDMotionFeatures:
    status: ModelStatus
    reason: Optional[str] = None
    smm_detected: bool = False
    smm_confidence: float = 0.0
    smm_frequency: float = 0.0
    smm_duration_seconds: float = 0.0
    smm_segments: List[List[int]] = field(default_factory=list)


@dataclass
class AVASDFeatures:
    status: ModelStatus
    reason: Optional[str] = None
    audio_video_congruence: Optional[float] = None
    behavioral_markers: Dict[str, Any] = field(default_factory=dict)


@dataclass
class NormalizedFeatures:
    # Scale: 0.0 to 1.0
    rrb_intensity: float = 0.0
    rrb_periodicity: float = 0.0
    rrb_confidence: float = 0.0
    smm_intensity: float = 0.0
    smm_confidence: float = 0.0
    questionnaire_score_ratio: Optional[float] = None
    has_video_evidence: bool = False


@dataclass
class TherapistRecommendation:
    specialization: str
    rationale: str
    suggested_focus: List[str]
    priority: str = "RECOMMENDED"


@dataclass
class FusionResult:
    # Primary behavioral screening outputs (NOT an autism diagnosis)
    support_indicator: str
    confidence_score: int
    percentage: int
    summary: str
    recommendations: List[str]
    disclaimer: str
    domain_breakdown: Dict[str, Any]
    models: Dict[str, Any]
    raw_model_metrics: Dict[str, Any]
    video_metadata: Dict[str, Any]
    therapist_recommendations: List[Dict[str, Any]]
    normalized_features: Dict[str, float]
    timing: Dict[str, float]
    video_analysis: Dict[str, Any] = field(default_factory=dict)
