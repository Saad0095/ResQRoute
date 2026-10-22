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

int Emergency::getSeverity() const
{
    return severity;
}

void Emergency::display()
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

bool EmergencyPriority::operator()(const Emergency &e1, const Emergency &e2) const
{
    // False means a has high priotiy than b, and vice versa
    if (e1.getSeverity() == e2.getSeverity())
        return e1.getId() > e2.getId();

    // True means b has high priotiy than a, and vice versa
    return e1.getSeverity() < e2.getSeverity();
}
