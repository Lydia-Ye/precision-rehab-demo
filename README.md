# Precision Rehabilitation App (Demo version)

**AI-based Personalized Rehabilitation Planning for Stroke Recovery - Frontend Demo Version**

This is a frontend-only demo version of the original precision rehabilitation system. The original system implements a precision rehabilitation platform designed to **optimize neurorehabilitation treatment plans using contextual model-based reinforcement learning (RL)**. It combines real-world patient data, hierarchical Bayesian models, and reinforcement learning to simulate, personalize, and adapt treatment schedules in a data-driven manner.

This demo version provides a standalone frontend interface that simulates the full-stack application's functionality using mock data, allowing users to explore and understand the system's capabilities without requiring the backend infrastructure.

---

## Background

This demo is based on the research paper:

> **"Towards AI-based Precision Neurorehabilitation via Contextual Model-based Reinforcement Learning"**  
> *(Schweighofer, Ye, Luo, Winstein et al., 2023 – JNER, minor revision)*

### Key Features:
- Simulates the original system's functionality with mock data
- Provides the same user interface and visualization capabilities
- Demonstrates treatment planning and recovery trajectory visualization
- No backend dependencies required

The original system was validated on **DOSE** and **EXCITE** datasets using **MAL (Motor Activity Log)** as the outcome metric.

---

## App Overview

This demo version focuses on the frontend component:

| Module   | Description |
|----------|-------------|
| **Frontend (Next.js)** | A standalone demo that simulates the full-stack application's functionality using mock data. Provides the same user interface for interacting with patient data, simulating schedules, and visualizing recovery trajectories. |

---

## Installation

### Frontend (Next.js)

```bash
cd health-app
npm install
npm run dev
```

This starts the frontend on `http://localhost:3000`.

---

## Original System Architecture

The original full-stack application consisted of:

| Module   | Description |
|----------|-------------|
| **Backend (Flask)** | Hosted patient models and MLFlow-tracked reinforcement learning agents. |
| **Frontend (Next.js)** | Allowed clinicians and researchers to interact with patient data, simulate schedules, and visualize recovery trajectories. |

The backend components (Flask + MLFlow) are not included in this demo version.

---

## 📖 References

* Schweighofer et al., 2023. *JNER*.
* Winstein et al., 2019. *DOSE Study*.
* Wolf et al., 2008. *EXCITE Trial*.
* Osband et al., 2013. *Posterior Sampling for RL*.
* Tang et al., 2023. *Posterior Sampling for POMDPs*.

