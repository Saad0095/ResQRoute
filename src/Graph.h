// Graph.h
// The city map.
//   Node (vertex) = a location, e.g. "Gulshan"
//   Edge          = a two-way road between two locations, with a length in km
// The graph is stored as an "adjacency list": for every location we keep
// a list of the roads that start from it.

#ifndef GRAPH_H
#define GRAPH_H

#include <string>
#include <vector>

using namespace std;

// A simple description of one road. Used when we save the map to a file.
struct Road
{
    string from;
    string to;
    double km;
};

class Graph
{
private:
    // One road that leaves a location.
    struct Edge
    {
        int to;     // index of the location this road leads to
        double km;  // length of the road
    };

    vector<string> names;            // names[i] = name of location number i
    vector< vector<Edge> > adj;      // adj[i]   = all roads leaving location i

    static string toLower(const string &s); // helper: "Gulshan" -> "gulshan"

public:
    int addLocation(const string &name);                      // returns new index, or -1 if not added
    bool addRoad(const string &a, const string &b, double km); // true if the road was added/updated
    int indexOf(const string &name) const;                    // location number, or -1 if not found
    int size() const;                                         // how many locations
    string nameOf(int index) const;                           // location name from its number
    vector<Road> getAllRoads() const;                         // every road once (used for saving)
    void display() const;                                     // print the whole map

    // Dijkstra: shortest distance from src to EVERY location.
    //   dist[i] = shortest km from src to i  (infinity if unreachable)
    //   prev[i] = the location we came from just before i (used to rebuild the path)
    void dijkstra(int src, vector<double> &dist, vector<int> &prev) const;

    // Shortest path between two locations.
    // Returns the distance in km (or -1 if no path) and fills "path" with location numbers.
    double shortestPath(int src, int dst, vector<int> &path) const;

    string pathToString(const vector<int> &path) const; // {0,2,5} -> "A -> C -> F"
};

#endif
