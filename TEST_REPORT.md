# Test Report – Car Dealership Inventory System

## Test Framework

Pytest

## Test Environment

- Python 3.12
- FastAPI backend
- SQLite database
- Windows

## Test Execution

The backend test suite was executed using:

```bash
python -m pytest -v
**Test Cases**
**Authentication**
1.User can register
2.User can log in

**Vehicle Management**
3.Add vehicle
4.Get all vehicles
5.Search vehicles by make
6.Update vehicle
7.Delete vehicle

**Inventory Operations**
8.Purchase vehicle
9.Restock vehicle

Authorization
10.Customer cannot restock vehicle
11.Customer cannot delete vehicle

**Final Test Result**
11 passed

**Result Summary**
**Category **             	     ** Result**
1.User Registration	              Passed
2.User Login	                    Passed
3.Add Vehicle	                    Passed
4.Get All Vehicles	              Passed
5.Search Vehicles	                Passed
6.Update Vehicle	                Passed
7.Delete Vehicle	                Passed
8.Purchase Vehicle	              Passed
9.Restock Vehicle	                Passed
10.Customer Restock Restriction  	Passed
11.Customer Delete Restriction	  Passed
Overall	11/11 Passed
**
Conclusion**
All 11 automated backend tests passed successfully. The test suite validates authentication, vehicle management, inventory operations, and role-based authorization.
