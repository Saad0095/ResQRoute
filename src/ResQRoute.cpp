// ResQRoute.cpp
// Contents:
//   1. Input helpers
//   2. Constructor and file handling (load / save / starter data)
//   3. Ambulances
//   4. Hospitals
//   5. Emergencies (including the automatic dispatch)
//   6. City map (graph) features
//   7. The main menu

#include "ResQRoute.h"
#include <algorithm>
#include <cstdlib>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>

using namespace std;

// The file where everything is stored. It is created in the folder you run the program from.
static const string DATA_FILE = "resqroute_data.txt";

// =====================================================================
// 1. INPUT HELPERS
// =====================================================================

// Reads an int from the keyboard. Returns false if the user typed something that is not a number.
static bool readInt(int &value)
{
    if (cin >> value)
        return true;

    cin.clear();                                         // fix cin after the bad input
    cin.ignore(numeric_limits<streamsize>::max(), '\n'); // throw away the bad text
    return false;
}

// Same as readInt, but for numbers with a decimal point (like 7.5 km).
static bool readDouble(double &value)
{
    if (cin >> value)
        return true;

    cin.clear();
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    return false;
}

// After "cin >> number" the Enter key is still waiting in the input.
// This removes it so the next getline() does not read an empty line.
static void flushLine()
{
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
}

// Cuts a line like "101|Ali|Gulshan|1" into pieces: {"101", "Ali", "Gulshan", "1"}.
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
    parts.push_back(current); // the last piece
    return parts;
}

// The file uses '|' as a separator, so a '|' typed by the user would break the file.
// We replace it with '-' before saving.
static string removeBars(string text)
{
    for (size_t i = 0; i < text.size(); i++)
    {
        if (text[i] == '|')
            text[i] = '-';
    }
    return text;
}

// Asks the user for a location name and checks that it exists on the city map.
// Returns true and fills "out" if it is valid.
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

    out = cityMap.nameOf(index); // use the official spelling, e.g. "clifton" -> "Clifton"
    return true;
}

// =====================================================================
// 2. CONSTRUCTOR AND FILE HANDLING
// =====================================================================

// Runs automatically when "ResQRoute app;" is created in main().
// No data is typed in here any more: everything comes from the file.
ResQRoute::ResQRoute()
{
    choice = -1;
    loadOrCreateData();
}

// If the data file exists   -> load it (starter data is NOT added again).
// If it does not exist      -> this is the first run: add starter data and create the file.
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

// The sample data. This runs ONLY when the data file is being created for the first time.
void ResQRoute::addStarterData()
{
    // City locations
    const char *locations[] = {"North Karachi", "Nazimabad", "Gulshan", "Saddar", "Clifton",
                               "DHA", "Korangi", "Malir", "Airport"};
    for (int i = 0; i < 9; i++)
        cityMap.addLocation(locations[i]);

    // Roads: addRoad(location1, location2, distance in km)
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

    // Ambulances: (id, driver, location, isAvailable)
    ambulances.push_back(Ambulance(101, "Ali", "North Karachi", true));
    ambulances.push_back(Ambulance(102, "Ahmed", "Gulshan", false));
    ambulances.push_back(Ambulance(103, "Usman", "Nazimabad", true));

    // Hospitals: (id, name, location, free beds)
    hospitals.push_back(Hospital(201, "City Hospital", "Gulshan", 12));
    hospitals.push_back(Hospital(202, "Central Hospital", "Nazimabad", 5));
    hospitals.push_back(Hospital(203, "Coastal Hospital", "Clifton", 8));
}

// Writes everything to the data file. The file is plain text, split into sections:
//
//   [LOCATIONS]      one location name per line
//   [ROADS]          from|to|km
//   [AMBULANCES]     id|driver|location|available(1 or 0)
//   [HOSPITALS]      id|name|location|freeBeds
//   [EMERGENCIES]    id|patient|location|severity
//
// Locations are written first because roads need them to exist when loading.
void ResQRoute::saveData() const
{
    ofstream file(DATA_FILE.c_str()); // opening for writing replaces the old content

    if (!file.is_open())
    {
        cout << "Warning: could not save data to '" << DATA_FILE << "'.\n";
        return;
    }

    // --- Locations ---
    file << "[LOCATIONS]\n";
    for (int i = 0; i < cityMap.size(); i++)
        file << removeBars(cityMap.nameOf(i)) << "\n";

    // --- Roads ---
    file << "[ROADS]\n";
    vector<Road> roads = cityMap.getAllRoads();
    for (size_t i = 0; i < roads.size(); i++)
        file << removeBars(roads[i].from) << "|" << removeBars(roads[i].to) << "|" << roads[i].km << "\n";

    // --- Ambulances ---
    file << "[AMBULANCES]\n";
    for (size_t i = 0; i < ambulances.size(); i++)
    {
        const Ambulance &a = ambulances[i];
        file << a.getId() << "|" << removeBars(a.getDriverName()) << "|"
             << removeBars(a.getLocation()) << "|" << (a.getAvailability() ? 1 : 0) << "\n";
    }

    // --- Hospitals ---
    file << "[HOSPITALS]\n";
    for (size_t i = 0; i < hospitals.size(); i++)
    {
        const Hospital &h = hospitals[i];
        file << h.getId() << "|" << removeBars(h.getName()) << "|"
             << removeBars(h.getLocation()) << "|" << h.getCapacity() << "\n";
    }

    // --- Pending emergencies ---
    // A priority_queue can only show its top element, so we work on a COPY
    // and pop that copy until it is empty. The real queue stays untouched.
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

// Reads the data file line by line.
//   - A line starting with '[' tells us which section we are in now.
//   - Any other line is one record of that section.
void ResQRoute::loadData(ifstream &file)
{
    string line;
    string section;      // the section we are currently reading, e.g. "[ROADS]"
    int lineNumber = 0;

    while (getline(file, line))
    {
        lineNumber++;

        // Files made on Windows can end lines with '\r'; remove it.
        if (!line.empty() && line[line.size() - 1] == '\r')
            line.erase(line.size() - 1);

        if (line.empty())
            continue;

        // A section heading: remember it and go to the next line.
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
            vector<string> p = splitByBar(line); // p[0]=from, p[1]=to, p[2]=km
            if (p.size() == 3)
                lineWasValid = cityMap.addRoad(p[0], p[1], atof(p[2].c_str()));
        }
        else if (section == "[AMBULANCES]")
        {
            vector<string> p = splitByBar(line); // id, driver, location, available
            if (p.size() == 4)
            {
                ambulances.push_back(Ambulance(atoi(p[0].c_str()), p[1], p[2], p[3] == "1"));
                lineWasValid = true;
            }
        }
        else if (section == "[HOSPITALS]")
        {
            vector<string> p = splitByBar(line); // id, name, location, free beds
            if (p.size() == 4)
            {
                hospitals.push_back(Hospital(atoi(p[0].c_str()), p[1], p[2], atoi(p[3].c_str())));
                lineWasValid = true;
            }
        }
        else if (section == "[EMERGENCIES]")
        {
            vector<string> p = splitByBar(line); // id, patient, location, severity
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

// =====================================================================
// 3. AMBULANCES
// =====================================================================

void ResQRoute::displayAmbulances() const
{
    cout << "\n--- Ambulance List ---\n";

    if (ambulances.empty())
    {
        cout << "No ambulances registered.\n";
        return;
    }

    // Range-based for loop: "ambulance" is each element in turn.
    // "const &" means: do not copy it and do not change it.
    for (const Ambulance &ambulance : ambulances)
    {
        ambulance.display();
    }
}

void ResQRoute::addAmbulance()
{
    // Step 1: read and check the ID.
    int id;
    cout << "Enter ambulance ID: ";
    if (!readInt(id) || id <= 0)
    {
        cout << "ID must be a positive number.\n";
        return;
    }

    // Step 2: make sure no other ambulance already uses this ID.
    // find_if walks through the list and stops at the first one for which the lambda returns true.
    // The lambda is a tiny nameless function; [id] lets it use the "id" typed above.
    auto it = find_if(
        ambulances.begin(),
        ambulances.end(),
        [id](const Ambulance &a)
        {
            return a.getId() == id;
        });

    if (it != ambulances.end()) // "end()" means "not found"; so here it WAS found
    {
        cout << "Ambulance ID already exists.\n";
        return;
    }

    // Step 3: read the remaining details.
    flushLine();

    string driver;
    cout << "Enter driver name: ";
    getline(cin, driver);

    string location;
    if (!readLocation("Enter current location: ", location))
        return;

    // Step 4: create the ambulance (it starts as available) and save.
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

    // Find the ambulance with this ID (same idea as in addAmbulance).
    auto it = find_if(
        ambulances.begin(),
        ambulances.end(),
        [id](const Ambulance &a)
        {
            return a.getId() == id;
        });

    if (it == ambulances.end()) // reached the end without finding it
    {
        cout << "Ambulance not found.\n";
        return;
    }

    it->toggleAvailability(); // "->" calls a function on the object the iterator points to
    saveData();

    cout << "Ambulance status updated.\n";
    it->display();
}

// =====================================================================
// 4. HOSPITALS
// =====================================================================

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
    // Step 1: read and check the ID.
    int id;
    cout << "Enter hospital ID: ";
    if (!readInt(id) || id <= 0)
    {
        cout << "ID must be a positive number.\n";
        return;
    }

    // Step 2: the ID must be new.
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

    // Step 3: read the remaining details.
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

    // Step 4: create the hospital and save.
    hospitals.push_back(Hospital(id, name, location, capacity));
    saveData();

    cout << "Hospital added successfully.\n";
}

// =====================================================================
// 5. EMERGENCIES
// =====================================================================

void ResQRoute::registerEmergency()
{
    // Step 1: read and check the ID.
    int id;
    cout << "Enter emergency ID: ";
    if (!readInt(id) || id <= 0)
    {
        cout << "ID must be a positive number.\n";
        return;
    }

    // Step 2: check the ID is new. A priority_queue cannot be searched directly,
    // so we pop elements from a COPY of it and compare IDs.
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

    // Step 3: read the remaining details.
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

    // Step 4: push into the priority queue (it puts it in the right order by itself) and save.
    emergencies.push(Emergency(id, patientName, location, severity));
    saveData();

    cout << "Emergency registered successfully.\n";
}

// Shows emergencies from most urgent to least urgent WITHOUT removing them.
void ResQRoute::displayEmergencies()
{
    cout << "\n--- Emergencies Sorted By Priority ---\n";

    if (emergencies.empty())
    {
        cout << "No emergencies registered.\n";
        return;
    }

    // Work on a copy so the real queue is not emptied.
    auto sortedEmergencies = emergencies;
    while (!sortedEmergencies.empty())
    {
        Emergency emergency = sortedEmergencies.top(); // most urgent left in the copy
        emergency.display();
        sortedEmergencies.pop();                       // remove it from the copy
    }
}

// Among all FREE ambulances, finds the one closest to the emergency.
//   dist       = distances from the emergency to every location (from Dijkstra)
//   distanceKm = filled with the distance of the chosen ambulance
// Returns its position in the "ambulances" list, or -1 if none can be used.
int ResQRoute::findNearestAmbulance(const vector<double> &dist, double &distanceKm) const
{
    int bestIndex = -1;
    distanceKm = numeric_limits<double>::infinity(); // "nothing found yet"

    for (size_t i = 0; i < ambulances.size(); i++)
    {
        // Busy ambulances cannot be sent.
        if (!ambulances[i].getAvailability())
            continue;

        int locationIndex = cityMap.indexOf(ambulances[i].getLocation());

        // Closer than the best one so far?
        if (locationIndex != -1 && dist[locationIndex] < distanceKm)
        {
            distanceKm = dist[locationIndex];
            bestIndex = (int)i;
        }
    }
    return bestIndex;
}

// Among all hospitals that still have a free bed, finds the one closest to the emergency.
int ResQRoute::findNearestHospital(const vector<double> &dist, double &distanceKm) const
{
    int bestIndex = -1;
    distanceKm = numeric_limits<double>::infinity();

    for (size_t i = 0; i < hospitals.size(); i++)
    {
        // A full hospital cannot take the patient.
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

// AUTOMATIC DISPATCH
//   most urgent emergency -> nearest free ambulance -> nearest hospital with a free bed
// If anything is missing, the emergency stays in the queue and is tried again later.
void ResQRoute::processNextEmergency()
{
    // Step 1: is there anything to process?
    if (emergencies.empty())
    {
        cout << "No pending emergencies to process.\n";
        return;
    }

    // Step 2: look at (but do NOT remove) the most urgent emergency.
    Emergency emergency = emergencies.top();

    int patientNode = cityMap.indexOf(emergency.getLocation());
    if (patientNode == -1)
    {
        cout << "Emergency location is not on the city map.\n";
        return;
    }

    // Step 3: one Dijkstra run from the patient gives the distance to every location.
    // Roads are two-way, so "patient -> ambulance" equals "ambulance -> patient".
    vector<double> dist;
    vector<int> prev;
    cityMap.dijkstra(patientNode, dist, prev);

    // Step 4: choose the nearest free ambulance.
    double ambulanceKm;
    int ambulanceIndex = findNearestAmbulance(dist, ambulanceKm);
    if (ambulanceIndex == -1)
    {
        cout << "No reachable available ambulance. Emergency remains pending.\n";
        return;
    }

    // Step 5: choose the nearest hospital that has space.
    double hospitalKm;
    int hospitalIndex = findNearestHospital(dist, hospitalKm);
    if (hospitalIndex == -1)
    {
        cout << "No reachable hospital with free capacity. Emergency remains pending.\n";
        return;
    }

    // These are references (second names) for the real objects in the lists,
    // so changes made through them change the real ambulance and hospital.
    Ambulance &ambulance = ambulances[ambulanceIndex];
    Hospital &hospital = hospitals[hospitalIndex];

    // Step 6: get the two actual routes to show to the user.
    vector<int> routeToPatient;
    vector<int> routeToHospital;
    cityMap.shortestPath(cityMap.indexOf(ambulance.getLocation()), patientNode, routeToPatient);
    cityMap.shortestPath(patientNode, cityMap.indexOf(hospital.getLocation()), routeToHospital);

    // Step 7: show the result.
    cout << "\n--- Processing Emergency ---";
    emergency.display();

    cout << "\n--- Assigned Ambulance ---";
    ambulance.display();

    cout << "\n--- Assigned Hospital ---";
    hospital.display();

    const double AVERAGE_SPEED_KMH = 40.0; // assumed speed, only used for the time estimate
    double totalKm = ambulanceKm + hospitalKm;

    cout << "\n--- Route ---\n";
    cout << "Ambulance -> Patient : " << cityMap.pathToString(routeToPatient)
         << " (" << ambulanceKm << " km)\n";
    cout << "Patient -> Hospital  : " << cityMap.pathToString(routeToHospital)
         << " (" << hospitalKm << " km)\n";
    cout << "Total distance       : " << totalKm << " km\n";
    cout << "Estimated time       : " << (totalKm / AVERAGE_SPEED_KMH) * 60.0
         << " min (at " << AVERAGE_SPEED_KMH << " km/h)\n";

    // Step 8: update the system.
    ambulance.toggleAvailability();                // it is busy now
    ambulance.setLocation(hospital.getLocation()); // and it ends at the hospital
    hospital.admitPatient();                       // one bed used
    emergencies.pop();                             // the emergency is handled, remove it
    saveData();

    cout << "Emergency processed successfully.\n";
}

// =====================================================================
// 6. CITY MAP (GRAPH) FEATURES
// =====================================================================

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

    // A name starting with '[' would be confused with a section heading in the data file.
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

// =====================================================================
// 7. THE MAIN MENU
// =====================================================================

void ResQRoute::run()
{
    // Print every decimal number with exactly 1 digit after the point (e.g. 21.0).
    cout << fixed << setprecision(1);

    cout << "** Welcome to ResQRoute **\n";

    // do-while: the menu is shown at least once, and again until the user picks 0.
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

        // If the user typed letters instead of a number, show a message and show the menu again.
        if (!readInt(choice))
        {
            if (cin.eof()) // the input has ended completely; stop to avoid an endless loop
                break;

            cout << "Invalid input. Please enter a number.\n";
            choice = -1;
            continue;
        }

        // Run the function that matches the chosen number.
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
            saveData(); // one last save before leaving
            cout << "Exiting ResQRoute... Thanks for Using!\n";
            break;
        default:
            cout << "Invalid choice. Please try again.\n";
        }

    } while (choice != 0);
}
