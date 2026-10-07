# Domain Glossary

## Visitor
A person who browses the Stone Shelter catalog and views information about stones.
A Visitor does not manage catalog data.

## Volunteer
A person who manages stones in the Stone Shelter.
A Volunteer can create, edit, and remove stones and update their information.

## Stone
An individual stone item registered in the Stone Shelter.
Each Stone has its own identity and attributes such as name, photo, Stone type, biography, adoption status, admission date, and size.

## Stone Catalog
The collection of stones registered in the Stone Shelter and available for browsing.
The catalog supports pagination, filtering, and sorting.

## Stone Type
The geological type assigned to a Stone.

## Stone Size
A simplified size classification of a Stone.
For the current version, supported values are:
- `SMALL`
- `MEDIUM`
- `LARGE`

## Adoption Status
The current adoption state of a Stone.

Supported values are:

- `AVAILABLE` — the Stone is available for adoption.
- `RESERVED` — the Stone has been reserved.
- `ADOPTED` — the Stone has been adopted.

## Stone Reservation
A visitor's request to begin adopting a specific Stone, containing their name,
contact details and creation timestamp. Creating a reservation changes an
AVAILABLE Stone to RESERVED; it does not complete adoption. At most one
reservation can exist for a Stone, linked by its identifier.

## Admission Date
The instant when a Stone was registered as admitted to the Stone Shelter.
It represents a moment in time, not a calendar date, and is supplied as a
timestamp with an explicit UTC offset. API responses represent it in UTC.

## Biography
Free-form information describing the individual Stone and its history in the shelter.
