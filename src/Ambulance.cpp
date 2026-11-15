// Ambulance.cpp
#include "Ambulance.h"
#include <iostream>

using namespace std;

// Constructor: copies the given values into the object's own variables.
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

// "!" means NOT, so true becomes false and false becomes true.
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
    // Ternary operator:  condition ? valueIfTrue : valueIfFalse
    cout << "Status: " << (isAvailable ? "Available" : "Busy") << "\n";
}
