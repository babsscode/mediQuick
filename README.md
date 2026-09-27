# mediQuick

## Inspiration

Healthcare professionals are constantly navigating clinical questions, patient concerns, and large amounts of information while working under significant time pressure. We wanted to reduce this mental load by creating a platform that does more than simply return information. **MediQuick** was inspired by the idea that when an HCP has a question, they should be able to quickly find the right resources, relevant conversations, and people who have experienced similar situations.

## What it does

MediQuick is an all-in-one HCP engagement platform that turns a clinical question into multiple personalized pathways. An HCP can search a concern or question and receive:

* **Resources:** Relevant medical information and educational resources.
* **Discussion:** Personalized discussion posts and conversations related to their question.
* **Peer Link:** Matches the HCP with 1–2 peers who have similar profiles, faced comparable situations, or have experience with the same type of problem. They can then connect and chat directly.
* **MSL Connection:** Provides a pathway to connect with a Medical Science Liaison when additional expert support is needed.

Instead of forcing HCPs to search across multiple places, MediQuick brings information, community, peer expertise, and expert connection into one workflow.

## How we built it

We built MediQuick as a full-stack web application using **React, TypeScript, Vite, Tailwind CSS, Firebase Authentication, and Firebase Firestore**. React and TypeScript power the interactive frontend, while Firebase handles authentication and persistent data such as discussions and user interactions.

We designed the experience around a simple workflow:

**Clinical Question → Personalized Information → Community → Peer Connection → Expert Support**

The platform uses the HCP's question and profile to guide them toward the most relevant pathway instead of making them manually search through disconnected resources.

## Challenges we ran into

One of our biggest challenges was designing an experience that was personalized without making it complicated. We wanted to give HCPs multiple options while keeping the interface simple enough that they could quickly understand what to do next.

We also had to connect several different workflows—including resources, discussions, peer matching, and messaging—into one cohesive experience. Building real-time user interactions with Firebase while maintaining authentication and access controls also required careful coordination between the frontend and backend.

## Accomplishments that we're proud of

We are proud of creating a platform that focuses on **connection rather than simply information retrieval**. Instead of stopping at an answer, MediQuick can help an HCP discover a relevant discussion, find a peer who has dealt with a similar situation, or connect with an expert.

We are also proud of **Peer Link**, which turns a clinical question into a personalized human connection. Rather than presenting an HCP with a large directory of users, the goal is to surface just 1–2 potentially relevant peers, reducing the effort required to find someone who understands their situation.

## What we learned

We learned that building an effective healthcare technology product is not just about adding more information or features. The real challenge is reducing the amount of work an HCP has to do to find what they need.

We also learned how important it is to design AI-assisted experiences around **human connection**. AI can help organize information, identify relevance, and reduce search burden, while people provide the experiences, perspectives, and conversations that technology cannot replace.

## What's next for MediQuick

Next, we want to make MediQuick's personalization and peer matching more intelligent. We could incorporate more detailed HCP profiles, specialties, interests, geographic context, and previous interactions to improve recommendations.

We also want to expand Peer Link into a stronger professional network, add more robust MSL workflows, and integrate richer real-world HCP engagement data.

Our long-term vision is for MediQuick to become a **single starting point for HCP questions—reducing mental load by connecting each question to the right information, conversation, peer, or expert.**
