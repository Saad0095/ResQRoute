// ResQRoute.h
// The main application class. It owns all the data and all the menu actions.

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
    // ---------- The data of the whole system ----------
    vector<Ambulance> ambulances;
    vector<Hospital> hospitals;
    // Emergencies wait here. top() always gives the MOST URGENT one
    // (the rule is in EmergencyPriority).
    priority_queue<Emergency, vector<Emergency>, EmergencyPriority> emergencies;
    Graph cityMap;

    // ---------- File handling ----------
    void loadOrCreateData();        // called once at start-up
    void addStarterData();          // sample data, used ONLY when the data file does not exist yet
    void loadData(ifstream &file);  // read everything from the file into the variables above
    void saveData() const;          // write everything to the file

    // ---------- Small helpers ----------
    bool readLocation(const string &prompt, string &out) const;
    int findNearestAmbulance(const vector<double> &dist, double &distanceKm) const;
    int findNearestHospital(const vector<double> &dist, double &distanceKm) const;

public:
    ResQRoute();

    // Ambulances
    void displayAmbulances() const;
    void addAmbulance();
    void updateAmbulanceStatus();

    // Hospitals
    void displayHospitals() const;
    void addHospital();

    // Emergencies
    void registerEmergency();
    void displayEmergencies();
    void processNextEmergency();

    // City map (graph)
    void displayCityMap() const;
    void addLocation();
    void addRoad();
    void findShortestRoute() const;

    int choice; // the menu option the user typed
    void run(); // the main menu loop
};

#endif
