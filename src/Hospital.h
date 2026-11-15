// Hospital.h
// Describes ONE hospital and how many more patients it can take.

#ifndef HOSPITAL_H
#define HOSPITAL_H

#include <string>

using namespace std;

class Hospital
{
private:
    int id;
    string name;
    string location;  // a location name that exists on the city map
    int capacity;     // number of free beds left

public:
    Hospital(int i = 0, string n = "Unknown", string loc = "Karachi", int c = 0);

    int getId() const;
    string getName() const;
    string getLocation() const;
    int getCapacity() const;

    bool admitPatient(); // uses one bed; returns false if there is no bed
    void display() const;
};

#endif
