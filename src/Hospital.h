#ifndef HOSPITAL_H
#define HOSPITAL_H

#include <string>

using namespace std;

class Hospital
{
private:
    int id;
    string name;
    string location;
    int capacity;

public:
    Hospital(int i = 0, string n = "Unknown", string loc = "Karachi", int c = 0);
    int getId() const;
    string getName() const;
    string getLocation() const;
    int getCapacity() const;
    bool admitPatient(); // uses one bed, false if full
    void display() const;
};

#endif
