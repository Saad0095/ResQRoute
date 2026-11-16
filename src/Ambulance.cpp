#include "Ambulance.h"
#include <iostream>

using namespace std;

Ambulance::Ambulance(int i, string d, string loc, bool av)
{
    id = i;
    driverName = d;
    location = loc;
    isAvailable = av;
}

int Ambulance::getId() const
{
    return id;
}

string Ambulance::getDriverName() const
{
    return driverName;
}

string Ambulance::getLocation() const
{
    return location;
}

bool Ambulance::getAvailability() const
{
    return isAvailable;
}

void Ambulance::setLocation(const string &loc)
{
    location = loc;
}

void Ambulance::toggleAvailability()
{
    isAvailable = !isAvailable;
}

void Ambulance::display() const
{
    cout << "\n";
    cout << "ID: " << id << "\n";
    cout << "Driver: " << driverName << "\n";
    cout << "Location: " << location << "\n";

    cout << "Status: " << (isAvailable ? "Available" : "Busy") << "\n";
}
