#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include "json.hpp"

using json = nlohmann::json;

struct PhoneNumber {
    std::string type;
    std::string number;
};

struct Person {
    std::string name;
    std::string address;
    std::vector<PhoneNumber> phoneNumbers;
};

// Function to add a new member to the telephone directory
void addMember(const std::string& name, const std::string& address, const std::string& phoneNumberType, const std::string& phoneNumber) {
    // Load existing data from the file
    std::ifstream file("database.json");
    json jsonDatabase;
    file >> jsonDatabase;
    file.close();

    // Add a new member
    Person newPerson;
    newPerson.name = name;
    newPerson.address = address;
    newPerson.phoneNumbers.push_back({phoneNumberType, phoneNumber});

    // Convert the new member to JSON and add it to the database
    jsonDatabase[name] = {
        {"address", address},
        {"phoneNumbers", {
            {{"type", phoneNumberType}, {"number", phoneNumber}}
        }}
    };

    // Save the updated database to the file
    std::ofstream outFile("database.json");
    outFile << std::setw(4) << jsonDatabase << std::endl;
    outFile.close();
}

int main() {
    // Simulate adding a new member (replace with actual input from Node.js server)
    addMember("John Doe", "123 Main Street", "home", "555-1234");

    // You can add more functionality or modify the code based on your requirements

    return 0;
}
