// Ambulance.h
// Describes ONE ambulance: who drives it, where it is, and whether it is free.

#ifndef AMBULANCE_H
#define AMBULANCE_H

#include <string>

using namespace std;

class Ambulance
{
private:
    int id;             // unique number, e.g. 101
    string driverName;
    string location;    // a location name that exists on the city map
    bool isAvailable;   // true = free, false = busy

public:
    // Default values let us write "Ambulance a;" without any arguments.
    Ambulance(int i = 101, string d = "Unknown", string loc = "Karachi", bool av = false);

    // Getters (read-only access to the private data)
    int getId() const;
    string getDriverName() const;
    string getLocation() const;
    bool getAvailability() const;

    // Setters / actions (change the data)
    void setLocation(const string &loc);
    void toggleAvailability(); // free -> busy, or busy -> free

    void display() const;
};

#endif
