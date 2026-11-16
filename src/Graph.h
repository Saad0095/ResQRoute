#ifndef GRAPH_H
#define GRAPH_H

#include <string>
#include <vector>

using namespace std;

struct Road
{
    string from;
    string to;
    double km;
};

class Graph
{
private:

    struct Edge
    {
        int to;
        double km;
    };

    vector<string> names;
    vector< vector<Edge> > adj;

    static string toLower(const string &s);

public:
    int addLocation(const string &name);
    bool addRoad(const string &a, const string &b, double km);
    int indexOf(const string &name) const;
    int size() const;
    string nameOf(int index) const;
    vector<Road> getAllRoads() const;
    void display() const;

    void dijkstra(int src, vector<double> &dist, vector<int> &prev) const;

    double shortestPath(int src, int dst, vector<int> &path) const;

    string pathToString(const vector<int> &path) const;
};

#endif
