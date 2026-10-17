#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <queue>
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
        cout << "ID: " << id
             << " | Driver: " << driverName
             << " | Location: " << location
             << " | Status: "
             << (isAvailable ? "Available" : "Busy")
             << '\n';
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
        cout << "ID: " << id
             << " | Name: " << name
             << " | Location: " << location
             << " | Available Beds: " << capacity
             << '\n';
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
        cout << "ID: " << id << "\n";
        cout << "Patient Name: " << patientName << "\n";
        cout << "Location: " << location << "\n";
        cout << "Condition: " << condition << "\n";
    }
};

struct EmergencyPriority
{
    bool operator()(const Emergency &e1, const Emergency &e2) const{
        // False means a has high priotiy than b, and vice versa
        if(e1.getSeverity() == e2.getSeverity()) return e1.getId() > e2.getId();
        
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

    int choice;
    void run()
    {
        cout << "** Welcome to ResQRoute **\n";
        do
        {
            cout << "1. Display Ambulances\n";
            cout << "2. Add Ambulance\n";
            cout << "3. Update Ambulance Status\n";
            cout << "4. Display Hospitals\n";
            cout << "5. Add Hospital\n";
            cout << "6. Register Emergency\n";
            cout << "7. Display Sorted Emergencies\n";
            cout << "0. Exit\n";
            cout << "Enter your choice: ";
            cin >> choice;

            switch (choice)
            {
            case 1:
                // displayAmbulances();
                break;
            case 2:
                // addAmbulance();
                break;
            case 3:
                // updateAmbulanceStatus();
                break;
            case 4:
                // displayHospitals();
                break;
            case 5:
                // addHospital();
                break;
            case 6:
                // registerEmergency();
                break;
            case 7:
                // displayEmergencies();
                break;
            case 0:
                cout << "Exiting ResQRoute...\n";
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