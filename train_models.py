"""Train the diabetes, hypertension, and stroke models."""

from backend.training import train_all_diseases


if __name__ == "__main__":
    reports = train_all_diseases()
    print("\nTraining summary:\n")
    for disease, report in reports.items():
        print(f"{disease}: {report['best_model']['model']} | F1={report['best_model']['f1']} | ROC-AUC={report['best_model']['roc_auc']}")
