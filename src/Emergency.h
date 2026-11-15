// Emergency.h
// Describes ONE emergency call (a patient who needs an ambulance).
// Also contains the rule that decides which emergency is more urgent.

#ifndef EMERGENCY_H
#define EMERGENCY_H

#include <string>

using namespace std;

class Emergency
{
private:
    int id;
    string patientName;
    string location;  // where the patient is (a name on the city map)
    int severity;     // 1 = Low, 2 = Medium, 3 = High, 4 = Critical

public:
    Emergency(int i = 0, string patient = "Unknown", string loc = "Karachi", int s = 1);

    int getId() const;
    string getPatientName() const;
    string getLocation() const;
    int getSeverity() const;

    void display() const;
};

// The priority_queue uses this "comparison rule" to decide who comes first.
// It is a struct with operator() so it can be called like a function.
struct EmergencyPriority
{
    bool operator()(const Emergency &e1, const Emergency &e2) const;
};

#endif
