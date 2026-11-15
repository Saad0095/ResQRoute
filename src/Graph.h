#ifndef GRAPH_H
#define GRAPH_H

#include <string>
#include <vector>

using namespace std;

// Undirected weighted graph: nodes are city locations, edges are roads (km).
class Graph
{
private:
    struct Edge
    {
        int to;
        double km;
    };

    vector<string> names;
    vector<vector<Edge>> adj;

    static string toLower(const string &s);

public:
    int addLocation(const string &name); // returns index, -1 if it already exists
    bool addRoad(const string &a, const string &b, double km);
    int indexOf(const string &name) const; // case-insensitive, -1 if not found
    int size() const;
    string nameOf(int index) const;
    void display() const;

    // Dijkstra. Fills dist/prev for every node reachable from src.
    void dijkstra(int src, vector<double> &dist, vector<int> &prev) const;

    // Shortest path src -> dst. Returns distance in km, or -1 if unreachable.
    double shortestPath(int src, int dst, vector<int> &path) const;

    string pathToString(const vector<int> &path) const;
};

#endif
