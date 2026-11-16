#ifndef RESQROUTE_H
#define RESQROUTE_H

#include "Ambulance.h"
#include "Hospital.h"
#include "Emergency.h"
#include "Graph.h"
#include <fstream>
#include <queue>
#include <vector>

using namespace std;

class ResQRoute
{
private:

    vector<Ambulance> ambulances;
    vector<Hospital> hospitals;

    priority_queue<Emergency, vector<Emergency>, EmergencyPriority> emergencies;
    Graph cityMap;

    void loadOrCreateData();
    void addStarterData();
    void loadData(ifstream &file);
    void saveData() const;

    bool readLocation(const string &prompt, string &out) const;
    int findNearestAmbulance(const vector<double> &dist, double &distanceKm) const;
    int findNearestHospital(const vector<double> &dist, double &distanceKm) const;

public:
    ResQRoute();

    void displayAmbulances() const;
    void addAmbulance();
    void updateAmbulanceStatus();

    void displayHospitals() const;
    void addHospital();

    void registerEmergency();
    void displayEmergencies();
    void processNextEmergency();

    void displayCityMap() const;
    void addLocation();
    void addRoad();
    void findShortestRoute() const;

    int choice;
    void run();
};

#endif
