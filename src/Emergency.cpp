// Emergency.cpp
#include "Emergency.h"
#include <iostream>
#include <string>

using namespace std;

Emergency::Emergency(int i, string patient, string loc, int s)
{
    id = i;
    patientName = patient;
    location = loc;
    severity = s;
}

int Emergency::getId() const
{
    return id;
}

string Emergency::getPatientName() const
{
    return patientName;
}

string Emergency::getLocation() const
{
    return location;
}

int Emergency::getSeverity() const
{
    return severity;
}

void Emergency::display() const
{
    // Turn the severity number into a readable word.
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
        condition = "Unknown";
        break;
    }

    cout << "\n";
    cout << "ID: " << id << "\n";
    cout << "Patient Name: " << patientName << "\n";
    cout << "Location: " << location << "\n";
    cout << "Condition: " << condition << "\n";
}

// How the priority_queue thinks:
//   returning TRUE  means  "e1 is LESS urgent than e2"  (so e2 must come out first)
//   returning FALSE means  "e1 is MORE urgent (or equal)"
bool EmergencyPriority::operator()(const Emergency &e1, const Emergency &e2) const
{
    // Same severity: the one registered earlier (smaller ID) goes first.
    if (e1.getSeverity() == e2.getSeverity())
        return e1.getId() > e2.getId();

    // Different severity: the higher severity goes first.
    return e1.getSeverity() < e2.getSeverity();
}
