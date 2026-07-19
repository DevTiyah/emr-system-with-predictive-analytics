# Defense Notes

## Why this project matters

It demonstrates a full EMR-style workflow: patient registration, visit recording, analytics, and explainable ML predictions in one working system.

## Why FastAPI was selected

FastAPI provides typed request validation, automatic docs, and a simple API-first pattern that works well for both HTML pages and JSON endpoints.

## Why SQLite was selected

SQLite keeps the project portable, easy to run locally, and simple to grade. The ORM layer can later be moved to PostgreSQL with limited structural change.

## Why scikit-learn was selected

It provides a reliable and understandable training workflow for classification, preprocessing, metrics, and pipelines without adding heavy infrastructure.

## Why a saved model bundle is used

The bundle keeps preprocessing and estimator together, so inference uses exactly the same feature handling as training.

## Why the models are disease-specific

Each disease has a different target variable and feature set. Separate models make the system easier to explain and align with the underlying datasets.

## Why the frontend is mostly vanilla JavaScript

The project is a single-repository academic system. A framework was not necessary to demonstrate the workflow and would have added unnecessary complexity.

## 50 Likely Defense Questions and Answers

1. What problem does the system solve?
   It digitizes a small EMR workflow and adds explainable disease-risk prediction.

2. Why did you choose FastAPI?
   It gives request validation, automatic docs, and a clean Python API structure.

3. Why did you choose SQLite?
   It is lightweight, portable, and appropriate for a demo-ready academic project.

4. Why did you not use Django or Flask?
   FastAPI made the API and prediction workflow simpler to express in a typed way.

5. How are patients stored?
   In the `patients` table using SQLAlchemy and SQLite.

6. How are visits stored?
   In the `visits` table and linked by `patient_code`.

7. Is there a foreign key relationship?
   No explicit foreign key is declared; the relationship is application-managed.

8. How is the dashboard populated?
   From `/api/bootstrap`, which includes dashboard and analytics summaries.

9. How does prediction work?
   The API normalizes the payload, loads the saved bundle, and calls the estimator.

10. Why are there three prediction endpoints?
    Each disease has its own dataset, feature set, and trained model.

11. How do you ensure feature consistency?
    The saved feature manifest and bundle use the same feature order as training.

12. What preprocessing is used?
    Column normalization, duplicate removal, binary coercion, imputation, scaling, and encoding.

13. How are missing values handled?
    Median for numeric fields and mode for categorical fields.

14. How is class imbalance handled?
    The pipeline uses SMOTE when available or balanced weighting otherwise.

15. Which models were compared?
    Logistic Regression, Random Forest, and Gradient Boosting; XGBoost is optional if installed.

16. Which model was selected for diabetes?
    Gradient Boosting.

17. Which model was selected for hypertension?
    Random Forest.

18. Which model was selected for stroke?
    Random Forest.

19. Why was diabetes harder to model?
    Its validation performance was lower and the task is less separable than the other two.

20. Why are hypertension and stroke scores so high?
    The datasets appear highly separable, so the best models achieve near-perfect validation metrics.

21. What metrics did you use?
    Accuracy, precision, recall, F1, ROC-AUC, confusion matrix, and classification report.

22. What is the training time?
    The audited training run took 38.50 seconds.

23. What is the inference time?
    Average TestClient latencies were about 198-233 ms depending on disease.

24. How do you explain predictions?
    The API returns probabilities, confidence, risk level, recommendations, and feature importance when available.

25. What does confidence mean?
    It is the probability expressed as a percentage string.

26. What does risk level mean?
    It is derived from probability thresholds in `backend.clinical.risk_level()`.

27. Why are recommendations rule-based?
    They make the output clinically readable and separate guidance from the model score.

28. Why did you keep `app.py`?
    It preserves compatibility with older startup entry points.

29. Does the app have server-side authentication?
    No. Authentication is mocked in the frontend with localStorage.

30. Is that secure for production?
    No, it is suitable for a demo but not production security.

31. Why is the system still acceptable academically?
    Because it demonstrates the full workflow, not just a model API.

32. How are analytics calculated?
    From aggregate SQL queries over the patient and visit tables.

33. How is the visits chart generated?
    By rendering monthly counts from the dashboard summary into SVG.

34. How is the disease distribution chart generated?
    By building a CSS `conic-gradient` donut from condition counts.

35. What makes the UI useful?
    It presents the app like a clinical workspace rather than a simple form.

36. What are the main frontend modules?
    Dashboard, patients, visit workflow, AI prediction, analytics, reports, and settings.

37. Are reports server-generated?
    In the current implementation, report downloads are client-generated CSV exports.

38. Can the system be extended to PDFs?
    Yes, but that is future work.

39. What are the strongest parts of the project?
    The backend pipeline, the saved model artifacts, and the explainable AI output.

40. What are the weakest parts?
    Client-side auth and the absence of automated tests.

41. Why is the database schema simple?
    The project is optimized for clarity and defense, not for enterprise complexity.

42. Why no migrations?
    The repository does not include Alembic or another migration system.

43. What makes the prediction pipeline reliable?
    The bundle carries preprocessing and estimator together.

44. How do you know the model receives the correct fields?
    The inference layer checks required features against the saved feature manifest.

45. How do you handle bad inputs?
    Validation raises clear HTTP errors or schema validation errors.

46. What is the most important limitation?
    Authentication is not enforced server-side.

47. What should be improved next?
    Automated tests, real auth, and stronger report/export handling.

48. Is the project ready for demo?
    Yes, the core flows are working and validated.

49. Is the project ready for submission?
    Yes, if the submission accepts the current demo-oriented auth and export design.

50. What is the final takeaway?
    The project is a working academic EMR with real models, explainable predictions, and a coherent UI.
