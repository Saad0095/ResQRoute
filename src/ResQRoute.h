#ifndef RESQROUTE_H
#define RESQROUTE_H

#include "Ambulance.h"
#include "Hospital.h"
#include "Emergency.h"
#include "Graph.h"
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

    bool readLocation(const string &prompt, string &out) const;

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

    // Graph features
    void displayCityMap() const;
    void addLocation();
    void addRoad();
    void findShortestRoute() const;

    int choice;
    void run();
};

#endif
