"""
Graph Data Structure & Dijkstra's Shortest Path Algorithm
with Dynamic Road Closures & Rerouting for ResQRoute Emergency Dispatch.
"""

import heapq
from typing import Dict, List, Tuple, Optional, Set


class CityGraph:
    """
    Weighted undirected graph representing city road networks.
    Vertices: City areas / zones / intersections.
    Edges: Roads with travel distance/time weights in kilometers/minutes.
    Supports dynamic road closures and live rerouting.
    """

    def __init__(self):
        # Adjacency list: node -> list of (neighbor, weight)
        self.adj_list: Dict[str, List[Tuple[str, float]]] = {}
        # Set of closed road tuples: (min(u,v), max(u,v))
        self.closed_roads: Set[Tuple[str, str]] = set()

    def add_node(self, node: str) -> None:
        if node not in self.adj_list:
            self.adj_list[node] = []

    def rename_node(self, old_name: str, new_name: str) -> None:
        if old_name not in self.adj_list or old_name == new_name:
            return
        edges = self.adj_list.pop(old_name)
        self.adj_list[new_name] = []
        for neighbor, weight in edges:
            if neighbor in self.adj_list:
                self.adj_list[neighbor] = [(new_name if n == old_name else n, w) for n, w in self.adj_list[neighbor]]
                self.adj_list[new_name].append((neighbor, weight))
        updated_closed = set()
        for u, v in self.closed_roads:
            nu = new_name if u == old_name else u
            nv = new_name if v == old_name else v
            updated_closed.add(self._edge_key(nu, nv))
        self.closed_roads = updated_closed

    def add_road(self, u: str, v: str, weight: float) -> None:
        """Add bidirectional road between zones u and v with given distance/time."""
        self.add_node(u)
        self.add_node(v)
        # Avoid duplicate edges: replace existing weight if already present
        self.adj_list[u] = [(neighbor, w) for neighbor, w in self.adj_list[u] if neighbor != v]
        self.adj_list[v] = [(neighbor, w) for neighbor, w in self.adj_list[v] if neighbor != u]
        self.adj_list[u].append((v, weight))
        self.adj_list[v].append((u, weight))

    def _edge_key(self, u: str, v: str) -> Tuple[str, str]:
        return (min(u, v), max(u, v))

    def toggle_road(self, u: str, v: str) -> bool:
        """
        Toggles the road closure state.
        Returns True if road is now CLOSED, False if OPEN.
        """
        key = self._edge_key(u, v)
        if key in self.closed_roads:
            self.closed_roads.remove(key)
            return False
        else:
            self.closed_roads.add(key)
            return True

    def is_road_closed(self, u: str, v: str) -> bool:
        return self._edge_key(u, v) in self.closed_roads

    def get_roads(self) -> List[Dict]:
        """Returns all road segments with closure status."""
        roads = []
        seen = set()
        for u in self.adj_list:
            for v, weight in self.adj_list[u]:
                key = self._edge_key(u, v)
                if key not in seen:
                    seen.add(key)
                    roads.append({
                        "u": key[0],
                        "v": key[1],
                        "weight": weight,
                        "isClosed": key in self.closed_roads
                    })
        return roads

    def get_nodes(self) -> List[str]:
        return list(self.adj_list.keys())

    def dijkstra(self, start_node: str) -> Tuple[Dict[str, float], Dict[str, Optional[str]]]:
        """
        Dijkstra's Algorithm to find shortest paths from start_node to all reachable nodes,
        dynamically skipping any roads that are currently marked closed.
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
                # Skip closed roads (dynamic detour rerouting)
                if self._edge_key(current_node, neighbor) in self.closed_roads:
                    continue

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

        path: List[str] = []
        curr: Optional[str] = end_node
        while curr is not None:
            path.append(curr)
            curr = predecessors[curr]

        path.reverse()
        return path, distances[end_node]


def build_default_city_map() -> CityGraph:
    """
    Creates the default road network of the simulated city (Karachi sectors).
    """
    graph = CityGraph()

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
        ("Gulshan", "Defense", 12.0),
        # Karachi Arterial Network (Malir <-> Shahrah-e-Faisal <-> Saddar)
        ("Malir", "Airport", 5.0),
        ("Malir", "Shahrah-e-Faisal", 8.0),
        ("Airport", "Shahrah-e-Faisal", 6.0),
        ("Shahrah-e-Faisal", "Gulshan", 5.5),
        ("Shahrah-e-Faisal", "Saddar", 7.0),
        ("Shahrah-e-Faisal", "Defense", 6.0),
        # Gulistan-e-Jauhar connections
        ("Gulistan-e-Jauhar", "Gulshan", 3.5),
        ("Gulistan-e-Jauhar", "Airport", 4.5),
    ]

    for u, v, w in roads:
        graph.add_road(u, v, w)

    return graph
