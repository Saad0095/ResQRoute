// Hospital.cpp
#include "Hospital.h"
#include <iostream>

using namespace std;

Hospital::Hospital(int i, string n, string loc, int c)
{
    id = i;
    name = n;
    location = loc;
    capacity = c;
}

int Hospital::getId() const
{
    return id;
}

string Hospital::getName() const
{
    return name;
}

string Hospital::getLocation() const
{
    return location;
}

int Hospital::getCapacity() const
{
    return capacity;
}

// Takes one bed. If the hospital is already full we do nothing and say "false".
bool Hospital::admitPatient()
{
    if (capacity <= 0)
        return false;

    capacity--;
    return true;
}

void Hospital::display() const
{
    cout << "\n";
    cout << "ID: " << id << "\n";
    cout << "Name: " << name << "\n";
    cout << "Location: " << location << "\n";
    cout << "Free Beds: " << capacity << "\n";
}
