#ifndef AMBULANCE_H
#define AMBULANCE_H

#include <string>

using namespace std;

class Ambulance
{
private:
    int id;
    string driverName;
    string location;
    bool isAvailable;

public:
    Ambulance(int i = 101, string d = "Unknown", string loc = "Karachi", bool av = false);
    int getId() const;
    string getLocation() const;
    void setLocation(const string &loc);
    bool getAvailibility() const;
    void updateAvailibility();
    void display() const;
};

#endif
