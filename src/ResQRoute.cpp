#include "ResQRoute.h"
#include <algorithm>
#include <iomanip>
#include <iostream>
#include <limits>

using namespace std;

// ---------- input helpers ----------
static bool readInt(int &value)
{
    if (cin >> value)
        return true;
    cin.clear();
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    return false;
}

static bool readDouble(double &value)
{
    if (cin >> value)
        return true;
    cin.clear();
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    return false;
}

static void flushLine()
{
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
}

// Asks for a location name and checks that it exists on the city map.
bool ResQRoute::readLocation(const string &prompt, string &out) const
{
    cout << prompt;
    getline(cin, out);
    int idx = cityMap.indexOf(out);
    if (idx == -1)
    {
        cout << "Location '" << out << "' is not on the city map. Add it first (option 10).\n";
        return false;
    }
    out = cityMap.nameOf(idx); // normalise capitalisation
    return true;
}

// ---------- setup ----------
ResQRoute::ResQRoute()
{
    // City map
        const char *locs[] = {"North Karachi", "Nazimabad", "Gulshan", "Saddar", "Clifton",
                          "DHA", "Korangi", "Malir", "Airport"};
    for (int i = 0; i < 9; i++)
        cityMap.addLocation(locs[i]);

    cityMap.addRoad("North Karachi", "Nazimabad", 6);
    cityMap.addRoad("North Karachi", "Gulshan", 11);
    cityMap.addRoad("Nazimabad", "Gulshan", 7);
    cityMap.addRoad("Nazimabad", "Saddar", 9);
    cityMap.addRoad("Gulshan", "Saddar", 10);
    cityMap.addRoad("Gulshan", "Airport", 8);
    cityMap.addRoad("Gulshan", "Malir", 11);
    cityMap.addRoad("Airport", "Malir", 7);
    cityMap.addRoad("Airport", "Saddar", 12);
    cityMap.addRoad("Saddar", "Clifton", 6);
    cityMap.addRoad("Clifton", "DHA", 5);
    cityMap.addRoad("DHA", "Korangi", 9);
    cityMap.addRoad("Korangi", "Malir", 10);
    cityMap.addRoad("Saddar", "Korangi", 13);

    ambulances.push_back(Ambulance(101, "Ali", "North Karachi", true));
    ambulances.push_back(Ambulance(102, "Ahmed", "Gulshan", false));
    ambulances.push_back(Ambulance(103, "Usman", "Nazimabad", true));

    hospitals.push_back(Hospital(201, "City Hospital", "Gulshan", 12));
    hospitals.push_back(Hospital(202, "Central Hospital", "Nazimabad", 5));
    hospitals.push_back(Hospital(203, "Coastal Hospital", "Clifton", 8));
}

// ---------- ambulances ----------
void ResQRoute::displayAmbulances() const
{
    cout << "\n--- Ambulance List ---\n";

    if (ambulances.empty())
    {
        cout << "No ambulances registered.\n";
        return;
    }

    for (const Ambulance &ambulance : ambulances)
        ambulance.display();
}

void ResQRoute::addAmbulance()
{
    int id;
    cout << "Enter ambulance ID: ";
    if (!readInt(id) || id <= 0)
    {
        cout << "ID must be a positive number.\n";
        return;
    }

    auto it = find_if(ambulances.begin(), ambulances.end(),
                      [id](const Ambulance &a)
                      { return a.getId() == id; });

    if (it != ambulances.end())
    {
        cout << "Ambulance ID already exists.\n";
        return;
    }

    flushLine();

    string driver;
    cout << "Enter driver name: ";
    getline(cin, driver);

    string location;
    if (!readLocation("Enter current location: ", location))
        return;

    ambulances.push_back(Ambulance(id, driver, location, true));
    cout << "Ambulance added successfully.\n";
}

void ResQRoute::updateAmbulanceStatus()
{
    int id;
    cout << "Enter ambulance ID: ";
    if (!readInt(id))
    {
        cout << "Invalid ID.\n";
        return;
    }

    auto it = find_if(ambulances.begin(), ambulances.end(),
                      [id](const Ambulance &a)
                      { return a.getId() == id; });

    if (it == ambulances.end())
    {
        cout << "Ambulance not found.\n";
        return;
    }

    it->updateAvailibility();
    cout << "Ambulance status updated.\n";
    it->display();
}

// ---------- hospitals ----------
void ResQRoute::displayHospitals() const
{
    cout << "\n--- Hospital List ---\n";

    if (hospitals.empty())
    {
        cout << "No hospitals registered.\n";
        return;
    }

    for (const Hospital &hospital : hospitals)
        hospital.display();
}

void ResQRoute::addHospital()
{
    int id;
    cout << "Enter hospital ID: ";
    if (!readInt(id) || id <= 0)
    {
        cout << "ID must be a positive number.\n";
        return;
    }

    auto it = find_if(hospitals.begin(), hospitals.end(),
                      [id](const Hospital &h)
                      { return h.getId() == id; });
    if (it != hospitals.end())
    {
        cout << "Hospital ID already exists.\n";
        return;
    }

    flushLine();

    string name;
    cout << "Enter hospital name: ";
    getline(cin, name);

    string location;
    if (!readLocation("Enter hospital location: ", location))
        return;

    int capacity;
    cout << "Enter hospital capacity: ";
    if (!readInt(capacity) || capacity <= 0)
    {
        cout << "Capacity must be a positive number.\n";
        return;
    }

    hospitals.push_back(Hospital(id, name, location, capacity));
    cout << "Hospital added successfully.\n";
}

// ---------- emergencies ----------
void ResQRoute::registerEmergency()
{
    int id;
    cout << "Enter emergency ID: ";
    if (!readInt(id) || id <= 0)
    {
        cout << "ID must be a positive number.\n";
        return;
    }

    auto temp = emergencies;
    while (!temp.empty())
    {
        if (temp.top().getId() == id)
        {
            cout << "Emergency ID already exists.\n";
            return;
        }
        temp.pop();
    }

    flushLine();

    string patientName;
    cout << "Enter patient name: ";
    getline(cin, patientName);

    string location;
    if (!readLocation("Enter emergency location: ", location))
        return;

    int severity;
    cout << "Enter severity (1-Low, 2-Medium, 3-High, 4-Critical): ";
    if (!readInt(severity) || severity < 1 || severity > 4)
    {
        cout << "Severity must be between 1 and 4.\n";
        return;
    }

    emergencies.push(Emergency(id, patientName, location, severity));
    cout << "Emergency registered successfully.\n";
}

void ResQRoute::displayEmergencies()
{
    cout << "\n--- Emergencies Sorted By Priority ---\n";

    if (emergencies.empty())
    {
        cout << "No emergencies registered.\n";
        return;
    }

    auto sortedEmergencies = emergencies;
    while (!sortedEmergencies.empty())
    {
        Emergency emergency = sortedEmergencies.top();
        emergency.display();
        sortedEmergencies.pop();
    }
}

// Dispatch: most urgent emergency -> nearest available ambulance -> nearest hospital with a free bed.
void ResQRoute::processNextEmergency()
{
    if (emergencies.empty())
    {
        cout << "No pending emergencies to process.\n";
        return;
    }

    Emergency emergency = emergencies.top();
    int src = cityMap.indexOf(emergency.getLocation());
    if (src == -1)
    {
        cout << "Emergency location is not on the city map.\n";
        return;
    }

    const double INF = numeric_limits<double>::infinity();
    vector<double> dist;
    vector<int> prev;
    cityMap.dijkstra(src, dist, prev); // roads are two-way, so distance from the emergency = distance to it

    // Nearest available ambulance
    int bestAmb = -1;
    double bestAmbDist = INF;
    for (size_t i = 0; i < ambulances.size(); i++)
    {
        if (!ambulances[i].getAvailibility())
            continue;
        int loc = cityMap.indexOf(ambulances[i].getLocation());
        if (loc != -1 && dist[loc] < bestAmbDist)
        {
            bestAmbDist = dist[loc];
            bestAmb = (int)i;
        }
    }

    if (bestAmb == -1)
    {
        cout << "No reachable available ambulance. Emergency remains pending.\n";
        return;
    }

    // Nearest hospital with free capacity
    int bestHosp = -1;
    double bestHospDist = INF;
    for (size_t i = 0; i < hospitals.size(); i++)
    {
        if (hospitals[i].getCapacity() <= 0)
            continue;
        int loc = cityMap.indexOf(hospitals[i].getLocation());
        if (loc != -1 && dist[loc] < bestHospDist)
        {
            bestHospDist = dist[loc];
            bestHosp = (int)i;
        }
    }

    if (bestHosp == -1)
    {
        cout << "No reachable hospital with free capacity. Emergency remains pending.\n";
        return;
    }

    Ambulance &amb = ambulances[bestAmb];
    Hospital &hosp = hospitals[bestHosp];

    vector<int> toPatient, toHospital;
    cityMap.shortestPath(cityMap.indexOf(amb.getLocation()), src, toPatient);
    cityMap.shortestPath(src, cityMap.indexOf(hosp.getLocation()), toHospital);

    cout << "\n--- Processing Emergency ---";
    emergency.display();

    cout << "\n--- Assigned Ambulance ---";
    amb.display();

    cout << "\n--- Assigned Hospital ---";
    hosp.display();

    const double SPEED_KMH = 40.0;
    double total = bestAmbDist + bestHospDist;

    cout << "\n--- Route ---\n";
    cout << "Ambulance -> Patient : " << cityMap.pathToString(toPatient)
         << " (" << bestAmbDist << " km)\n";
    cout << "Patient -> Hospital  : " << cityMap.pathToString(toHospital)
         << " (" << bestHospDist << " km)\n";
    cout << "Total distance       : " << total << " km\n";
    cout << "Estimated time       : " << (total / SPEED_KMH) * 60.0 << " min (at " << SPEED_KMH << " km/h)\n";

    // Update state
    amb.updateAvailibility();               // now busy
    amb.setLocation(hosp.getLocation());    // ends up at the hospital
    hosp.admitPatient();                    // one bed used
    emergencies.pop();

    cout << "Emergency processed successfully.\n";
}

// ---------- graph features ----------
void ResQRoute::displayCityMap() const
{
    cityMap.display();
}

void ResQRoute::addLocation()
{
    flushLine();
    string name;
    cout << "Enter new location name: ";
    getline(cin, name);

    if (cityMap.addLocation(name) == -1)
        cout << "Invalid name or location already exists.\n";
    else
        cout << "Location added. Connect it with a road (option 11).\n";
}

void ResQRoute::addRoad()
{
    flushLine();
    string a, b;
    if (!readLocation("Enter first location: ", a))
        return;
    if (!readLocation("Enter second location: ", b))
        return;

    double km;
    cout << "Enter distance in km: ";
    if (!readDouble(km) || km <= 0)
    {
        cout << "Distance must be a positive number.\n";
        return;
    }

    if (cityMap.addRoad(a, b, km))
        cout << "Road added between " << a << " and " << b << ".\n";
    else
        cout << "Could not add road (locations must be different).\n";
}

void ResQRoute::findShortestRoute() const
{
    flushLine();
    string a, b;
    if (!readLocation("Enter start location: ", a))
        return;
    if (!readLocation("Enter destination: ", b))
        return;

    vector<int> path;
    double km = cityMap.shortestPath(cityMap.indexOf(a), cityMap.indexOf(b), path);
    if (km < 0)
    {
        cout << "No route exists between these locations.\n";
        return;
    }

    cout << "\nShortest route: " << cityMap.pathToString(path) << "\n";
    cout << "Distance: " << km << " km\n";
}

// ---------- main loop ----------
void ResQRoute::run()
{
    cout << fixed << setprecision(1);
    cout << "** Welcome to ResQRoute **\n";
    choice = -1;
    do
    {
        cout << "\n";
        cout << "1.  Display Ambulances\n";
        cout << "2.  Add Ambulance\n";
        cout << "3.  Update Ambulance Status\n";
        cout << "4.  Display Hospitals\n";
        cout << "5.  Add Hospital\n";
        cout << "6.  Register Emergency\n";
        cout << "7.  Display Sorted Emergencies\n";
        cout << "8.  Process Next Emergency (auto-dispatch)\n";
        cout << "9.  Display City Map\n";
        cout << "10. Add Location\n";
        cout << "11. Add Road\n";
        cout << "12. Find Shortest Route\n";
        cout << "0.  Exit\n";
        cout << "Enter your choice: ";

        if (!readInt(choice))
        {
            if (cin.eof())
                break;
            cout << "Invalid input. Please enter a number.\n";
            choice = -1;
            continue;
        }

        switch (choice)
        {
        case 1: displayAmbulances(); break;
        case 2: addAmbulance(); break;
        case 3: updateAmbulanceStatus(); break;
        case 4: displayHospitals(); break;
        case 5: addHospital(); break;
        case 6: registerEmergency(); break;
        case 7: displayEmergencies(); break;
        case 8: processNextEmergency(); break;
        case 9: displayCityMap(); break;
        case 10: addLocation(); break;
        case 11: addRoad(); break;
        case 12: findShortestRoute(); break;
        case 0:
            cout << "Exiting ResQRoute... Thanks for Using!\n";
            break;
        default:
            cout << "Invalid choice. Please try again.\n";
        }

    } while (choice != 0);
}
