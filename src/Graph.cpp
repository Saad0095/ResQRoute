// Graph.cpp
#include "Graph.h"
#include <algorithm>
#include <iostream>
#include <limits>
#include <queue>

using namespace std;

// Makes every letter small so that "gulshan", "GULSHAN" and "Gulshan" are treated the same.
string Graph::toLower(const string &s)
{
    string result = s;
    for (size_t i = 0; i < result.size(); i++)
        result[i] = (char)tolower((unsigned char)result[i]);
    return result;
}

// Looks for a location by name. Returns its number, or -1 if it is not on the map.
int Graph::indexOf(const string &name) const
{
    string wanted = toLower(name);

    for (size_t i = 0; i < names.size(); i++)
    {
        if (toLower(names[i]) == wanted)
            return (int)i;
    }
    return -1;
}

// Adds a new location (node) with no roads yet.
int Graph::addLocation(const string &name)
{
    // Refuse empty names and names that already exist.
    if (name.empty() || indexOf(name) != -1)
        return -1;

    names.push_back(name);
    adj.push_back(vector<Edge>()); // this new location starts with an empty list of roads
    return (int)names.size() - 1;  // its number is the last position
}

// Adds a two-way road between locations a and b.
bool Graph::addRoad(const string &a, const string &b, double km)
{
    int u = indexOf(a);
    int v = indexOf(b);

    // Both locations must exist, must be different, and the length must be positive.
    if (u == -1 || v == -1 || u == v || km <= 0)
        return false;

    // If this road already exists, only update its length (both directions).
    for (size_t i = 0; i < adj[u].size(); i++)
    {
        if (adj[u][i].to == v)
        {
            adj[u][i].km = km;
            for (size_t j = 0; j < adj[v].size(); j++)
            {
                if (adj[v][j].to == u)
                    adj[v][j].km = km;
            }
            return true;
        }
    }

    // Otherwise create the road in BOTH directions (the graph is undirected).
    Edge roadFromU;
    roadFromU.to = v;
    roadFromU.km = km;
    adj[u].push_back(roadFromU);

    Edge roadFromV;
    roadFromV.to = u;
    roadFromV.km = km;
    adj[v].push_back(roadFromV);

    return true;
}

int Graph::size() const
{
    return (int)names.size();
}

string Graph::nameOf(int index) const
{
    if (index >= 0 && index < size())
        return names[index];
    return "Unknown";
}

// Every road is stored twice (u->v and v->u), so we keep only the one where u < v.
vector<Road> Graph::getAllRoads() const
{
    vector<Road> roads;

    for (int u = 0; u < size(); u++)
    {
        for (size_t i = 0; i < adj[u].size(); i++)
        {
            int v = adj[u][i].to;
            if (u < v)
            {
                Road r;
                r.from = names[u];
                r.to = names[v];
                r.km = adj[u][i].km;
                roads.push_back(r);
            }
        }
    }
    return roads;
}

void Graph::display() const
{
    cout << "\n--- City Map (Locations & Roads) ---\n";

    if (names.empty())
    {
        cout << "No locations registered.\n";
        return;
    }

    for (size_t i = 0; i < names.size(); i++)
    {
        cout << "\n"
             << names[i] << ":\n";

        if (adj[i].empty())
            cout << "   (no roads)\n";

        for (size_t j = 0; j < adj[i].size(); j++)
            cout << "   -> " << names[adj[i][j].to] << " (" << adj[i][j].km << " km)\n";
    }
}

// DIJKSTRA'S ALGORITHM
// Idea: always take the location that is currently the closest to the start,
// then check if going through it gives its neighbours a shorter distance.
void Graph::dijkstra(int src, vector<double> &dist, vector<int> &prev) const
{
    const double INFINITE = numeric_limits<double>::infinity(); // "not reached yet"

    // Step 1: at the start every location is unreachable and has no previous location.
    dist.assign(size(), INFINITE);
    prev.assign(size(), -1);

    if (src < 0 || src >= size())
        return;

    // Step 2: a min-priority-queue of (distance, location). The smallest distance comes out first.
    typedef pair<double, int> DistAndNode;
    priority_queue<DistAndNode, vector<DistAndNode>, greater<DistAndNode> > queueOfNodes;

    // Step 3: the start is 0 km away from itself.
    dist[src] = 0;
    queueOfNodes.push(make_pair(0.0, src));

    // Step 4: keep processing the closest unprocessed location.
    while (!queueOfNodes.empty())
    {
        double currentDist = queueOfNodes.top().first;
        int current = queueOfNodes.top().second;
        queueOfNodes.pop();

        // An older, longer entry for this location may still be in the queue; ignore it.
        if (currentDist > dist[current])
            continue;

        // Look at every road leaving this location.
        for (size_t i = 0; i < adj[current].size(); i++)
        {
            int neighbour = adj[current][i].to;
            double newDist = dist[current] + adj[current][i].km;

            // Found a shorter way to reach the neighbour? Remember it.
            if (newDist < dist[neighbour])
            {
                dist[neighbour] = newDist;
                prev[neighbour] = current;
                queueOfNodes.push(make_pair(newDist, neighbour));
            }
        }
    }
}

// Runs Dijkstra from src, then walks BACKWARDS from dst using prev[] to build the path.
double Graph::shortestPath(int src, int dst, vector<int> &path) const
{
    path.clear();

    if (src < 0 || dst < 0 || src >= size() || dst >= size())
        return -1;

    vector<double> dist;
    vector<int> prev;
    dijkstra(src, dist, prev);

    // Still "infinite" means there is no road connection at all.
    if (dist[dst] == numeric_limits<double>::infinity())
        return -1;

    // Walk from the destination back to the start (the start has prev = -1).
    for (int v = dst; v != -1; v = prev[v])
        path.push_back(v);

    // We collected it backwards, so flip it.
    reverse(path.begin(), path.end());

    return dist[dst];
}

string Graph::pathToString(const vector<int> &path) const
{
    string text;
    for (size_t i = 0; i < path.size(); i++)
    {
        if (i > 0)
            text += " -> ";
        text += names[path[i]];
    }
    return text;
}
