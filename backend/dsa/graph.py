"""
Graph Data Structure & Dijkstra's Shortest Path Algorithm
for ResQRoute Emergency Dispatch.
"""

import heapq
from typing import Dict, List, Tuple, Optional


class CityGraph:
    """
    Weighted undirected graph representing city road networks.
    Vertices: City areas / zones / intersections.
    Edges: Roads with travel distance/time weights in kilometers/minutes.
    """

    def __init__(self):
        # Adjacency list: node -> list of (neighbor, weight)
        self.adj_list: Dict[str, List[Tuple[str, float]]] = {}

    def add_node(self, node: str) -> None:
        if node not in self.adj_list:
            self.adj_list[node] = []

    def add_road(self, u: str, v: str, weight: float) -> None:
        """Add bidirectional road between zones u and v with given distance/time."""
        self.add_node(u)
        self.add_node(v)
        self.adj_list[u].append((v, weight))
        self.adj_list[v].append((u, weight))

    def get_nodes(self) -> List[str]:
        return list(self.adj_list.keys())

    def dijkstra(self, start_node: str) -> Tuple[Dict[str, float], Dict[str, Optional[str]]]:
        """
        Dijkstra's Algorithm to find shortest paths from start_node to all other reachable nodes.
        Complexity: O((V + E) log V) using a binary heap (priority queue).
        
        Returns:
            distances: mapping of destination_node -> shortest distance
            predecessors: mapping of destination_node -> previous node along shortest path
        """
        if start_node not in self.adj_list:
            raise ValueError(f"Start location '{start_node}' does not exist in road network.")

        distances: Dict[str, float] = {node: float("inf") for node in self.adj_list}
        predecessors: Dict[str, Optional[str]] = {node: None for node in self.adj_list}
        distances[start_node] = 0.0

        # Min-heap priority queue storing (distance, current_node)
        pq: List[Tuple[float, str]] = [(0.0, start_node)]

        while pq:
            current_dist, current_node = heapq.heappop(pq)

            # Stale heap entry check
            if current_dist > distances[current_node]:
                continue

            for neighbor, weight in self.adj_list[current_node]:
                new_dist = current_dist + weight

                # Relaxation step
                if new_dist < distances[neighbor]:
                    distances[neighbor] = new_dist
                    predecessors[neighbor] = current_node
                    heapq.heappush(pq, (new_dist, neighbor))

        return distances, predecessors

    def get_shortest_path(self, start_node: str, end_node: str) -> Tuple[List[str], float]:
        """
        Reconstructs the shortest path and total distance from start_node to end_node.
        """
        distances, predecessors = self.dijkstra(start_node)

        if distances.get(end_node, float("inf")) == float("inf"):
            return [], float("inf")

        # Reconstruct path using predecessors map
        path: List[str] = []
        curr: Optional[str] = end_node
        while curr is not None:
            path.append(curr)
            curr = predecessors[curr]

        path.reverse()
        return path, distances[end_node]


def build_default_city_map() -> CityGraph:
    """
    Creates the default road network of the simulated city (e.g. Karachi sectors).
    """
    graph = CityGraph()

    # Major arterial roads with distances (in km / estimated minutes)
    roads = [
        ("North Karachi", "Nazimabad", 6.5),
        ("Nazimabad", "Gulshan", 5.0),
        ("North Karachi", "Gulshan", 9.0),
        ("Nazimabad", "Saddar", 7.0),
        ("Gulshan", "Saddar", 8.0),
        ("Gulshan", "Airport", 10.0),
        ("Saddar", "Clifton", 4.0),
        ("Clifton", "Defense", 5.0),
        ("Saddar", "Defense", 6.5),
        ("Airport", "Defense", 14.0),
        ("Gulshan", "Defense", 12.0)
    ]

    for u, v, w in roads:
        graph.add_road(u, v, w)

    return graph

