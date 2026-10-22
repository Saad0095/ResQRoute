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
    Hospital(int i = 0, string n = "Unkown", string loc = "Karachi", int c = 0);
    void display() const;
};

#endif
