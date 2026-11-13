"""
Priority Queue (Heap) Data Structure for Emergency Triage.
Ensures higher-severity emergencies (Critical > High > Medium > Low)
are serviced first.
"""

import heapq
import time
from typing import Optional, List, Dict, Any


class TriageEmergency:
    """
    Wrapper for emergency calls so Python's heapq can order them.
    Priority order:
    1. Higher severity (4: Critical, 3: High, 2: Medium, 1: Low)
    2. Earlier arrival timestamp (tie-breaker)
    """

    def __init__(self, emergency_id: str, patient_name: str, location: str, severity: int, description: str = ""):
        self.emergency_id = emergency_id
        self.patient_name = patient_name
        self.location = location
        self.severity = severity
        self.description = description
        self.created_at = time.time()

    def __lt__(self, other: "TriageEmergency") -> bool:
        # We invert severity for min-heap behavior so highest severity pops first
        if self.severity != other.severity:
            return self.severity > other.severity
        # Tie-breaker: earlier timestamp gets priority
        return self.created_at < other.created_at

    def to_dict(self) -> Dict[str, Any]:
        severity_labels = {1: "Low", 2: "Medium", 3: "High", 4: "Critical"}
        return {
            "id": self.emergency_id,
            "patientName": self.patient_name,
            "location": self.location,
            "severity": self.severity,
            "severityLabel": severity_labels.get(self.severity, "Unknown"),
            "description": self.description,
            "createdAt": self.created_at
        }


class EmergencyPriorityQueue:
    """
    Max-heap based priority queue for triage processing.
    """

    def __init__(self):
        self._heap: List[TriageEmergency] = []

    def push(self, emergency: TriageEmergency) -> None:
        """Add an emergency into the priority queue in O(log N)."""
        heapq.heappush(self._heap, emergency)

    def pop(self) -> Optional[TriageEmergency]:
        """Extract highest priority emergency in O(log N)."""
        if self.is_empty():
            return None
        return heapq.heappop(self._heap)

    def peek(self) -> Optional[TriageEmergency]:
        """View highest priority emergency without removing in O(1)."""
        if self.is_empty():
            return None
        return self._heap[0]

    def is_empty(self) -> bool:
        return len(self._heap) == 0

    def size(self) -> int:
        return len(self._heap)

    def to_list(self) -> List[Dict[str, Any]]:
        # Return sorted copy without modifying internal heap
        sorted_copy = sorted(self._heap)
        return [e.to_dict() for e in sorted_copy]

