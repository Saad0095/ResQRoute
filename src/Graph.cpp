#include "Graph.h"
#include <algorithm>
#include <iostream>
#include <limits>
#include <queue>

using namespace std;

string Graph::toLower(const string &s)
{
    string result = s;
    for (size_t i = 0; i < result.size(); i++)
        result[i] = (char)tolower((unsigned char)result[i]);
    return result;
}

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

int Graph::addLocation(const string &name)
{

    if (name.empty() || indexOf(name) != -1)
        return -1;

    names.push_back(name);
    adj.push_back(vector<Edge>());
    return (int)names.size() - 1;
}

bool Graph::addRoad(const string &a, const string &b, double km)
{
    int u = indexOf(a);
    int v = indexOf(b);

    if (u == -1 || v == -1 || u == v || km <= 0)
        return false;

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

void Graph::dijkstra(int src, vector<double> &dist, vector<int> &prev) const
{
    const double INFINITE = numeric_limits<double>::infinity();

    dist.assign(size(), INFINITE);
    prev.assign(size(), -1);

    if (src < 0 || src >= size())
        return;

    typedef pair<double, int> DistAndNode;
    priority_queue<DistAndNode, vector<DistAndNode>, greater<DistAndNode> > queueOfNodes;

    dist[src] = 0;
    queueOfNodes.push(make_pair(0.0, src));

    while (!queueOfNodes.empty())
    {
        double currentDist = queueOfNodes.top().first;
        int current = queueOfNodes.top().second;
        queueOfNodes.pop();

        if (currentDist > dist[current])
            continue;

        for (size_t i = 0; i < adj[current].size(); i++)
        {
            int neighbour = adj[current][i].to;
            double newDist = dist[current] + adj[current][i].km;

            if (newDist < dist[neighbour])
            {
                dist[neighbour] = newDist;
                prev[neighbour] = current;
                queueOfNodes.push(make_pair(newDist, neighbour));
            }
        }
    }
}

double Graph::shortestPath(int src, int dst, vector<int> &path) const
{
    path.clear();

    if (src < 0 || dst < 0 || src >= size() || dst >= size())
        return -1;

    vector<double> dist;
    vector<int> prev;
    dijkstra(src, dist, prev);

    if (dist[dst] == numeric_limits<double>::infinity())
        return -1;

    for (int v = dst; v != -1; v = prev[v])
        path.push_back(v);

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
