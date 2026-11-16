#include "ResQRoute.h"
#include <algorithm>
#include <cstdlib>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>

using namespace std;

static const string DATA_FILE = "resqroute_data.txt";

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

static vector<string> splitByBar(const string &line)
{
    vector<string> parts;
    string current;

    for (size_t i = 0; i < line.size(); i++)
    {
        if (line[i] == '|')
        {
            parts.push_back(current);
            current.clear();
        }
        else
        {
            current += line[i];
        }
    }
    parts.push_back(current);
    return parts;
}

static string removeBars(string text)
{
    for (size_t i = 0; i < text.size(); i++)
    {
        if (text[i] == '|')
            text[i] = '-';
    }
    return text;
}

bool ResQRoute::readLocation(const string &prompt, string &out) const
{
    cout << prompt;
    getline(cin, out);

    int index = cityMap.indexOf(out);
    if (index == -1)
    {
        cout << "Location '" << out << "' is not on the city map. Add it first (option 10).\n";
        return false;
    }

    out = cityMap.nameOf(index);
    return true;
}

ResQRoute::ResQRoute()
{
    choice = -1;
    loadOrCreateData();
}

void ResQRoute::loadOrCreateData()
{
    ifstream file(DATA_FILE.c_str());

    if (!file.is_open())
    {
        cout << "No data file found. Creating '" << DATA_FILE << "' with starter data (first run only).\n";
        addStarterData();
        saveData();
        return;
    }

    cout << "Loading saved data from '" << DATA_FILE << "'...\n";
    loadData(file);
    file.close();
}

void ResQRoute::addStarterData()
{

    const char *locations[] = {"North Karachi", "Nazimabad", "Gulshan", "Saddar", "Clifton",
                               "DHA", "Korangi", "Malir", "Airport"};
    for (int i = 0; i < 9; i++)
        cityMap.addLocation(locations[i]);

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

void ResQRoute::saveData() const
{
    ofstream file(DATA_FILE.c_str());

    if (!file.is_open())
    {
        cout << "Warning: could not save data to '" << DATA_FILE << "'.\n";
        return;
    }

    file << "[LOCATIONS]\n";
    for (int i = 0; i < cityMap.size(); i++)
        file << removeBars(cityMap.nameOf(i)) << "\n";

    file << "[ROADS]\n";
    vector<Road> roads = cityMap.getAllRoads();
    for (size_t i = 0; i < roads.size(); i++)
        file << removeBars(roads[i].from) << "|" << removeBars(roads[i].to) << "|" << roads[i].km << "\n";

    file << "[AMBULANCES]\n";
    for (size_t i = 0; i < ambulances.size(); i++)
    {
        const Ambulance &a = ambulances[i];
        file << a.getId() << "|" << removeBars(a.getDriverName()) << "|"
             << removeBars(a.getLocation()) << "|" << (a.getAvailability() ? 1 : 0) << "\n";
    }

    file << "[HOSPITALS]\n";
    for (size_t i = 0; i < hospitals.size(); i++)
    {
        const Hospital &h = hospitals[i];
        file << h.getId() << "|" << removeBars(h.getName()) << "|"
             << removeBars(h.getLocation()) << "|" << h.getCapacity() << "\n";
    }

    file << "[EMERGENCIES]\n";
    priority_queue<Emergency, vector<Emergency>, EmergencyPriority> queueCopy = emergencies;
    while (!queueCopy.empty())
    {
        const Emergency &e = queueCopy.top();
        file << e.getId() << "|" << removeBars(e.getPatientName()) << "|"
             << removeBars(e.getLocation()) << "|" << e.getSeverity() << "\n";
        queueCopy.pop();
    }
}

void ResQRoute::loadData(ifstream &file)
{
    string line;
    string section;
    int lineNumber = 0;

    while (getline(file, line))
    {
        lineNumber++;

        if (!line.empty() && line[line.size() - 1] == '\r')
            line.erase(line.size() - 1);

        if (line.empty())
            continue;

        if (line[0] == '[')
        {
            section = line;
            continue;
        }

        bool lineWasValid = false;

        if (section == "[LOCATIONS]")
        {
            lineWasValid = (cityMap.addLocation(line) != -1);
        }
        else if (section == "[ROADS]")
        {
            vector<string> p = splitByBar(line);
            if (p.size() == 3)
                lineWasValid = cityMap.addRoad(p[0], p[1], atof(p[2].c_str()));
        }
        else if (section == "[AMBULANCES]")
        {
            vector<string> p = splitByBar(line);
            if (p.size() == 4)
            {
                ambulances.push_back(Ambulance(atoi(p[0].c_str()), p[1], p[2], p[3] == "1"));
                lineWasValid = true;
            }
        }
        else if (section == "[HOSPITALS]")
        {
            vector<string> p = splitByBar(line);
            if (p.size() == 4)
            {
                hospitals.push_back(Hospital(atoi(p[0].c_str()), p[1], p[2], atoi(p[3].c_str())));
                lineWasValid = true;
            }
        }
        else if (section == "[EMERGENCIES]")
        {
            vector<string> p = splitByBar(line);
            if (p.size() == 4)
            {
                emergencies.push(Emergency(atoi(p[0].c_str()), p[1], p[2], atoi(p[3].c_str())));
                lineWasValid = true;
            }
        }

        if (!lineWasValid)
            cout << "Warning: skipped an invalid line (" << lineNumber << ") in the data file.\n";
    }
}

void ResQRoute::displayAmbulances() const
{
    cout << "\n--- Ambulance List ---\n";

    if (ambulances.empty())
    {
        cout << "No ambulances registered.\n";
        return;
    }

    for (const Ambulance &ambulance : ambulances)
    {
        ambulance.display();
    }
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

    auto it = find_if(
        ambulances.begin(),
        ambulances.end(),
        [id](const Ambulance &a)
        {
            return a.getId() == id;
        });

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
    saveData();

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

    auto it = find_if(
        ambulances.begin(),
        ambulances.end(),
        [id](const Ambulance &a)
        {
            return a.getId() == id;
        });

    if (it == ambulances.end())
    {
        cout << "Ambulance not found.\n";
        return;
    }

    it->toggleAvailability();
    saveData();

    cout << "Ambulance status updated.\n";
    it->display();
}

void ResQRoute::displayHospitals() const
{
    cout << "\n--- Hospital List ---\n";

    if (hospitals.empty())
    {
        cout << "No hospitals registered.\n";
        return;
    }

    for (const Hospital &hospital : hospitals)
    {
        hospital.display();
    }
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

    auto it = find_if(
        hospitals.begin(),
        hospitals.end(),
        [id](const Hospital &h)
        {
            return h.getId() == id;
        });

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
    saveData();

    cout << "Hospital added successfully.\n";
}

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
    saveData();

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

int ResQRoute::findNearestAmbulance(const vector<double> &dist, double &distanceKm) const
{
    int bestIndex = -1;
    distanceKm = numeric_limits<double>::infinity();

    for (size_t i = 0; i < ambulances.size(); i++)
    {

        if (!ambulances[i].getAvailability())
            continue;

        int locationIndex = cityMap.indexOf(ambulances[i].getLocation());

        if (locationIndex != -1 && dist[locationIndex] < distanceKm)
        {
            distanceKm = dist[locationIndex];
            bestIndex = (int)i;
        }
    }
    return bestIndex;
}

int ResQRoute::findNearestHospital(const vector<double> &dist, double &distanceKm) const
{
    int bestIndex = -1;
    distanceKm = numeric_limits<double>::infinity();

    for (size_t i = 0; i < hospitals.size(); i++)
    {

        if (hospitals[i].getCapacity() <= 0)
            continue;

        int locationIndex = cityMap.indexOf(hospitals[i].getLocation());

        if (locationIndex != -1 && dist[locationIndex] < distanceKm)
        {
            distanceKm = dist[locationIndex];
            bestIndex = (int)i;
        }
    }
    return bestIndex;
}

void ResQRoute::processNextEmergency()
{

    if (emergencies.empty())
    {
        cout << "No pending emergencies to process.\n";
        return;
    }

    Emergency emergency = emergencies.top();

    int patientNode = cityMap.indexOf(emergency.getLocation());
    if (patientNode == -1)
    {
        cout << "Emergency location is not on the city map.\n";
        return;
    }

    vector<double> dist;
    vector<int> prev;
    cityMap.dijkstra(patientNode, dist, prev);

    double ambulanceKm;
    int ambulanceIndex = findNearestAmbulance(dist, ambulanceKm);
    if (ambulanceIndex == -1)
    {
        cout << "No reachable available ambulance. Emergency remains pending.\n";
        return;
    }

    double hospitalKm;
    int hospitalIndex = findNearestHospital(dist, hospitalKm);
    if (hospitalIndex == -1)
    {
        cout << "No reachable hospital with free capacity. Emergency remains pending.\n";
        return;
    }

    Ambulance &ambulance = ambulances[ambulanceIndex];
    Hospital &hospital = hospitals[hospitalIndex];

    vector<int> routeToPatient;
    vector<int> routeToHospital;
    cityMap.shortestPath(cityMap.indexOf(ambulance.getLocation()), patientNode, routeToPatient);
    cityMap.shortestPath(patientNode, cityMap.indexOf(hospital.getLocation()), routeToHospital);

    cout << "\n--- Processing Emergency ---";
    emergency.display();

    cout << "\n--- Assigned Ambulance ---";
    ambulance.display();

    cout << "\n--- Assigned Hospital ---";
    hospital.display();

    const double AVERAGE_SPEED_KMH = 40.0;
    double totalKm = ambulanceKm + hospitalKm;

    cout << "\n--- Route ---\n";
    cout << "Ambulance -> Patient : " << cityMap.pathToString(routeToPatient)
         << " (" << ambulanceKm << " km)\n";
    cout << "Patient -> Hospital  : " << cityMap.pathToString(routeToHospital)
         << " (" << hospitalKm << " km)\n";
    cout << "Total distance       : " << totalKm << " km\n";
    cout << "Estimated time       : " << (totalKm / AVERAGE_SPEED_KMH) * 60.0
         << " min (at " << AVERAGE_SPEED_KMH << " km/h)\n";

    ambulance.toggleAvailability();
    ambulance.setLocation(hospital.getLocation());
    hospital.admitPatient();
    emergencies.pop();
    saveData();

    cout << "Emergency processed successfully.\n";
}

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

    if (!name.empty() && name[0] == '[')
    {
        cout << "Location name cannot start with '['.\n";
        return;
    }

    if (cityMap.addLocation(name) == -1)
    {
        cout << "Invalid name or location already exists.\n";
    }
    else
    {
        saveData();
        cout << "Location added. Connect it with a road (option 11).\n";
    }
}

void ResQRoute::addRoad()
{
    flushLine();

    string firstLocation;
    string secondLocation;

    if (!readLocation("Enter first location: ", firstLocation))
        return;
    if (!readLocation("Enter second location: ", secondLocation))
        return;

    double km;
    cout << "Enter distance in km: ";
    if (!readDouble(km) || km <= 0)
    {
        cout << "Distance must be a positive number.\n";
        return;
    }

    if (cityMap.addRoad(firstLocation, secondLocation, km))
    {
        saveData();
        cout << "Road added between " << firstLocation << " and " << secondLocation << ".\n";
    }
    else
    {
        cout << "Could not add road (locations must be different).\n";
    }
}

void ResQRoute::findShortestRoute() const
{
    flushLine();

    string startName;
    string destinationName;

    if (!readLocation("Enter start location: ", startName))
        return;
    if (!readLocation("Enter destination: ", destinationName))
        return;

    vector<int> path;
    double km = cityMap.shortestPath(cityMap.indexOf(startName), cityMap.indexOf(destinationName), path);

    if (km < 0)
    {
        cout << "No route exists between these locations.\n";
        return;
    }

    cout << "\nShortest route: " << cityMap.pathToString(path) << "\n";
    cout << "Distance: " << km << " km\n";
}

void ResQRoute::run()
{

    cout << fixed << setprecision(1);

    cout << "** Welcome to ResQRoute **\n";

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
        case 1:
            displayAmbulances();
            break;
        case 2:
            addAmbulance();
            break;
        case 3:
            updateAmbulanceStatus();
            break;
        case 4:
            displayHospitals();
            break;
        case 5:
            addHospital();
            break;
        case 6:
            registerEmergency();
            break;
        case 7:
            displayEmergencies();
            break;
        case 8:
            processNextEmergency();
            break;
        case 9:
            displayCityMap();
            break;
        case 10:
            addLocation();
            break;
        case 11:
            addRoad();
            break;
        case 12:
            findShortestRoute();
            break;
        case 0:
            saveData();
            cout << "Exiting ResQRoute... Thanks for Using!\n";
            break;
        default:
            cout << "Invalid choice. Please try again.\n";
        }

    } while (choice != 0);
}
