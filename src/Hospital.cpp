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

void Hospital::display() const
{
    cout << "\n";
    cout << "ID: " << id << "\n";
    cout << "Name: " << name << "\n";
    cout << "Location: " << location << "\n";
    cout << "Capacity Of Patients: " << capacity << "\n";
}
