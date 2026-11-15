// #include "Graph.h"
// #include <algorithm>
// #include <iostream>
// #include <limits>
// #include <queue>

// using namespace std;

// string Graph::toLower(const string &s)
// {
//     string r = s;
//     transform(r.begin(), r.end(), r.begin(),
//               [](unsigned char c)
//               { return tolower(c); });
//     return r;
// }

// int Graph::indexOf(const string &name) const
// {
//     string key = toLower(name);
//     for (size_t i = 0; i < names.size(); i++)
//         if (toLower(names[i]) == key)
//             return (int)i;
//     return -1;
// }

// int Graph::addLocation(const string &name)
// {
//     if (name.empty() || indexOf(name) != -1)
//         return -1;
//     names.push_back(name);
//     adj.push_back({});
//     return (int)names.size() - 1;
// }

// bool Graph::addRoad(const string &a, const string &b, double km)
// {
//     int u = indexOf(a), v = indexOf(b);
//     if (u == -1 || v == -1 || u == v || km <= 0)
//         return false;

//     // Update the distance if the road already exists
//     for (Edge &e : adj[u])
//         if (e.to == v)
//         {
//             e.km = km;
//             for (Edge &r : adj[v])
//                 if (r.to == u)
//                     r.km = km;
//             return true;
//         }

//     adj[u].push_back({v, km});
//     adj[v].push_back({u, km});
//     return true;
// }

// int Graph::size() const
// {
//     return (int)names.size();
// }

// string Graph::nameOf(int index) const
// {
//     return (index >= 0 && index < size()) ? names[index] : "Unknown";
// }

// void Graph::display() const
// {
//     cout << "\n--- City Map (Locations & Roads) ---\n";
//     if (names.empty())
//     {
//         cout << "No locations registered.\n";
//         return;
//     }
//     for (size_t i = 0; i < names.size(); i++)
//     {
//         cout << "\n"
//              << names[i] << ":\n";
//         if (adj[i].empty())
//             cout << "   (no roads)\n";
//         for (const Edge &e : adj[i])
//             cout << "   -> " << names[e.to] << " (" << e.km << " km)\n";
//     }
// }

// void Graph::dijkstra(int src, vector<double> &dist, vector<int> &prev) const
// {
//     const double INF = numeric_limits<double>::infinity();
//     dist.assign(size(), INF);
//     prev.assign(size(), -1);
//     if (src < 0 || src >= size())
//         return;

//     using P = pair<double, int>;
//     priority_queue<P, vector<P>, greater<P>> pq;
//     dist[src] = 0;
//     pq.push({0, src});

//     while (!pq.empty())
//     {
//         double d = pq.top().first;
//         int u = pq.top().second;
//         pq.pop();
//         if (d > dist[u])
//             continue;
//         for (const Edge &e : adj[u])
//         {
//             if (dist[u] + e.km < dist[e.to])
//             {
//                 dist[e.to] = dist[u] + e.km;
//                 prev[e.to] = u;
//                 pq.push({dist[e.to], e.to});
//             }
//         }
//     }
// }

// double Graph::shortestPath(int src, int dst, vector<int> &path) const
// {
//     path.clear();
//     if (src < 0 || dst < 0 || src >= size() || dst >= size())
//         return -1;

//     vector<double> dist;
//     vector<int> prev;
//     dijkstra(src, dist, prev);

//     if (dist[dst] == numeric_limits<double>::infinity())
//         return -1;

//     for (int v = dst; v != -1; v = prev[v])
//         path.push_back(v);
//     reverse(path.begin(), path.end());
//     return dist[dst];
// }

// string Graph::pathToString(const vector<int> &path) const
// {
//     string s;
//     for (size_t i = 0; i < path.size(); i++)
//     {
//         if (i)
//             s += " -> ";
//         s += names[path[i]];
//     }
//     return s;
// }




#include "Graph.h"
#include <algorithm>
#include <iostream>
#include <limits>
#include <queue>

using namespace std;

string Graph::toLower(const string &s)
{
    string r = s;
    for (size_t i = 0; i < r.size(); i++)
        r[i] = (char)tolower((unsigned char)r[i]);
    return r;
}

int Graph::indexOf(const string &name) const
{
    string key = toLower(name);
    for (size_t i = 0; i < names.size(); i++)
        if (toLower(names[i]) == key)
            return (int)i;
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
    int u = indexOf(a), v = indexOf(b);
    if (u == -1 || v == -1 || u == v || km <= 0)
        return false;

    for (size_t i = 0; i < adj[u].size(); i++)
    {
        if (adj[u][i].to == v)
        {
            adj[u][i].km = km;
            for (size_t j = 0; j < adj[v].size(); j++)
                if (adj[v][j].to == u)
                    adj[v][j].km = km;
            return true;
        }
    }

    Edge e1;
    e1.to = v;
    e1.km = km;
    adj[u].push_back(e1);

    Edge e2;
    e2.to = u;
    e2.km = km;
    adj[v].push_back(e2);
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
    const double INF = numeric_limits<double>::infinity();
    dist.assign(size(), INF);
    prev.assign(size(), -1);
    if (src < 0 || src >= size())
        return;

    typedef pair<double, int> P;
    priority_queue<P, vector<P>, greater<P> > pq;
    dist[src] = 0;
    pq.push(make_pair(0.0, src));

    while (!pq.empty())
    {
        double d = pq.top().first;
        int u = pq.top().second;
        pq.pop();
        if (d > dist[u])
            continue;
        for (size_t i = 0; i < adj[u].size(); i++)
        {
            int to = adj[u][i].to;
            double nd = dist[u] + adj[u][i].km;
            if (nd < dist[to])
            {
                dist[to] = nd;
                prev[to] = u;
                pq.push(make_pair(nd, to));
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
    string s;
    for (size_t i = 0; i < path.size(); i++)
    {
        if (i)
            s += " -> ";
        s += names[path[i]];
    }
    return s;
}