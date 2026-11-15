// main.cpp
// The program starts here. All the real work is inside the ResQRoute class.

#include "ResQRoute.h"

int main()
{
    ResQRoute app; // the constructor loads the saved data (or creates the file the first time)
    app.run();     // shows the menu until the user chooses Exit
    return 0;
}
