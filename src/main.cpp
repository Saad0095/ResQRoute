#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <queue>
#include <limits>
using namespace std;

class Ambulance
{
private:
    int id;
    string driverName;
    string location;
    bool isAvailable;

public:
    Ambulance(int i = 101, string d = "Unkown", string loc = "Karachi", bool av = false)
    {
        id = i;
        driverName = d;
        location = loc;
        isAvailable = av;
    }

    int getId() const
    {
        return id;
    }
    bool getAvailibility() const
    {
        return isAvailable;
    }
    void updateAvailibility()
    {
        isAvailable = !isAvailable;
    }

    void display() const
    {
        cout << "\n";
        cout << "ID: " << id << "\n";
        cout << "Driver: " << driverName << "\n";
        cout << "Location: " << location << "\n";
        cout << "Status: " << (isAvailable ? "Available" : "Busy") << '\n';
    }
};

class Hospital
{
private:
    int id;
    string name;
    string location;
    int capacity;

public:
    Hospital(int i = 0, string n = "Unkown", string loc = "Karachi", int c = 0)
    {
        id = i;
        name = n;
        location = loc;
        capacity = c;
    }

    void display() const
    {
        cout << "\n";
        cout << "ID: " << id << "\n";
        cout << "Name: " << name << "\n";
        cout << "Location: " << location << "\n";
        cout << "Capacity Of Patients: " << capacity << "\n";
    }
};

class Emergency
{
private:
    int id;
    string patientName;
    string location;
    int severity;

public:
    Emergency(int i = 000, string patient = "Unknown", string loc = "Karachi", int s = 1)
    {
        id = i;
        patientName = patient;
        location = loc;
        severity = s;
    }

    int getId() const
    {
        return id;
    }

    int getSeverity() const
    {
        return severity;
    }

    void display()
    {
        string condition;

        switch (severity)
        {
        case 1:
            condition = "Low";
            break;
        case 2:
            condition = "Medium";
            break;
        case 3:
            condition = "High";
            break;
        case 4:
            condition = "Critical";
            break;

        default:
            break;
        }

        cout << "\n";
        cout << "ID: " << id << "\n";
        cout << "Patient Name: " << patientName << "\n";
        cout << "Location: " << location << "\n";
        cout << "Condition: " << condition << "\n";
    }
};

struct EmergencyPriority
{
    bool operator()(const Emergency &e1, const Emergency &e2) const
    {
        // False means a has high priotiy than b, and vice versa
        if (e1.getSeverity() == e2.getSeverity())
            return e1.getId() > e2.getId();

        // True means b has high priotiy than a, and vice versa
        return e1.getSeverity() < e2.getSeverity();
    }
};

class ResQRoute
{
private:
    vector<Ambulance> ambulances;
    vector<Hospital> hospitals;
    priority_queue<Emergency, vector<Emergency>, EmergencyPriority> emergencies;

public:
    ResQRoute()
    {
        ambulances.push_back(Ambulance(101, "Ali", "North Karachi", true));
        ambulances.push_back(Ambulance(102, "Ahmed", "Gulshan", false));
        ambulances.push_back(Ambulance(103, "Usman", "Nazimabad", true));

        hospitals.push_back(Hospital(201, "City Hospital", "Gulshan", 12));
        hospitals.push_back(Hospital(202, "Central Hospital", "Nazimabad", 5));
    }

    void displayAmbulances() const
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
    void addAmbulance()
    {
        int id;
        cout << "Enter ambulance ID: ";
        cin >> id;

        if (id <= 0)
        {
            cout << "ID must be positive.\n";
            return;
        }

        auto it = find_if(
            ambulances.begin(),
            ambulances.end(),
            [id](const Ambulance &ambulance)
            {
                return ambulance.getId() == id;
            });

        if (it != ambulances.end())
        {
            cout << "Ambulance ID already exists.\n";
            return;
        }

        cin.ignore(numeric_limits<streamsize>::max(), '\n');

        string driver;
        cout << "Enter driver name: ";
        getline(cin, driver);
        string location;
        cout << "Enter current location: ";
        getline(cin, location);

        ambulances.push_back(Ambulance(id, driver, location));

        cout << "Ambulance added successfully.\n";
    }

    void updateAmbulanceStatus()
    {
        int id;
        cout << "Enter ambulance ID: ";
        cin >> id;

        auto it = find_if(
            ambulances.begin(),
            ambulances.end(),
            [id](const Ambulance &ambulance)
            {
                return ambulance.getId() == id;
            });

        if (it == ambulances.end())
        {
            cout << "Ambulance not found.\n";
            return;
        }

        it->updateAvailibility();

        cout << "Ambulance status updated.\n";
        it->display();
    }

    void displayHospitals() const
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

    void addHospital()
    {
        int id;
        cout << "Enter hospital ID: ";
        cin >> id;

        if (id <= 0)
        {
            cout << "ID must be positive.\n";
            return;
        }

        cin.ignore(numeric_limits<streamsize>::max(), '\n');

        string name;
        cout << "Enter hospital name: ";
        getline(cin, name);

        string location;
        cout << "Enter hospital location: ";
        getline(cin, location);

        int capacity;
        cout << "Enter hospital capacity: ";
        cin >> capacity;

        if (capacity <= 0)
        {
            cout << "Capacity must be positive.\n";
            return;
        }

        hospitals.push_back(Hospital(id, name, location, capacity));
        cout << "Hospital added successfully.\n";
    }

    void registerEmergency()
    {
        int id;
        cout << "Enter emergency ID: ";
        cin >> id;

        if (id <= 0)
        {
            cout << "ID must be positive.\n";
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

        cin.ignore(numeric_limits<streamsize>::max(), '\n');

        string patientName;
        cout << "Enter patient name: ";
        getline(cin, patientName);

        string location;
        cout << "Enter emergency location: ";
        getline(cin, location);

        int severity;
        cout << "Enter severity (1-Low, 2-Medium, 3-High, 4-Critical): ";
        cin >> severity;

        if (severity < 1 || severity > 4)
        {
            cout << "Severity must be between 1 and 4.\n";
            return;
        }

        emergencies.push(Emergency(id, patientName, location, severity));
        cout << "Emergency registered successfully.\n";
    }

    void displayEmergencies()
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

    void processNextEmergency()
    {
        if (emergencies.empty())
        {
            cout << "No pending emergencies to process.\n";
            return;
        }

        auto amb = find_if(
            ambulances.begin(),
            ambulances.end(),
            [](const Ambulance &ambulance)
            {
                return ambulance.getAvailibility();
            });

        if (amb == ambulances.end())
        {
            cout << "No available ambulances. Emergency remains pending.\n";
            return;
        }

        Emergency emergency = emergencies.top();

        cout << "\n--- Processing Emergency ---\n";
        emergency.display();

        cout << "\n--- Assigned Ambulance ---\n";
        amb->display();

        amb->updateAvailibility();
        emergencies.pop();

        cout << "Emergency processed successfully.\n";
    }

    int choice;
    void run()
    {
        cout << "** Welcome to ResQRoute **\n";
        choice = -1;
        do
        {
            cout << "\n";
            cout << "1. Display Ambulances\n";
            cout << "2. Add Ambulance\n";
            cout << "3. Update Ambulance Status\n";
            cout << "4. Display Hospitals\n";
            cout << "5. Add Hospital\n";
            cout << "6. Register Emergency\n";
            cout << "7. Display Sorted Emergencies\n";
            cout << "8. Process Next Emergency\n";
            cout << "0. Exit\n";
            cout << "Enter your choice: ";
            cin >> choice;

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
            case 0:
                cout << "Exiting ResQRoute... Thanks for Using!\n";
                break;
            default:
                cout << "Invalid choice. Please try again.\n";
            }

        } while (choice != 0);
    }
};

int main()
{
    ResQRoute app;
    app.run();
    return 0;
}