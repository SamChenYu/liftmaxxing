# Whitechapel Station Transfer Model

## Scenario:

Angus is commuting to work. 

He makes a stop at Whitechapel station, changing from the District to the Elizabeth line.

He can take the long escalator which is usually filled and very long, or he can take the risk of transfering through the overground line and taking the lift which can either

- save time
- take longer than the escalator

Given TFL live station data, can we get a prediction window where he will be able to succesfully save time?



```mermaid
flowchart LR

%% =========================
%% NODES (LINES ONLY)
%% =========================

D["District / Hammersmith Line"]
O["Overground"]
E["Elizabeth Line"]

%% =========================
%% TRANSFER MECHANISMS (AS EDGES)
%% =========================

D -->|Fast Stairs| O
O -->|Fast Stairs| D
O -->|Fast Lift| E
D -->|Slow Escalator| E

%% =========================
%% STYLING
%% =========================

%% Line colours
classDef district fill:#2ecc71,color:#ffffff,stroke:#1e8449;
classDef overground fill:#ff8c00,color:#ffffff,stroke:#cc7000;
classDef elizabeth fill:#6f42c1,color:#ffffff,stroke:#4b2c82;

%% Transfer system colours
classDef transfer fill:#95a5a6,color:#ffffff,stroke:#7f8c8d;
classDef lift fill:#e74c3c,color:#ffffff,stroke:#922b21;

%% Apply node styles
class D district;
class O overground;
class E elizabeth;
