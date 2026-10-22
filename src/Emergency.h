#ifndef EMERGENCY_H
#define EMERGENCY_H

#include <string>

using namespace std;

class Emergency
{
private:
    int id;
    string patientName;
    string location;
    int severity;

public:
    Emergency(int i = 000, string patient = "Unknown", string loc = "Karachi", int s = 1);
    int getId() const;
    int getSeverity() const;
    void display();
};

struct EmergencyPriority
{
    bool operator()(const Emergency &e1, const Emergency &e2) const;
};

#endif
