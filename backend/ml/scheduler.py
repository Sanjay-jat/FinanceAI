from apscheduler.schedulers.background import BackgroundScheduler
from ml.train import train_model
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def retrain_all_models():
    logger.info("Starting weekly model retraining...")
    for asset in ["gold", "silver", "nifty"]:
        try:
            train_model(asset)
            logger.info(f"Retrained model for {asset}")
        except Exception as e:
            logger.error(f"Error retraining {asset}: {e}")
    logger.info("Weekly retraining complete!")

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        retrain_all_models,
        trigger="cron",
        day_of_week="sun",
        hour=0,
        minute=0,
        id="weekly_retrain"
    )
    scheduler.start()
    logger.info("Scheduler started — models retrain every Sunday midnight")
    return scheduler