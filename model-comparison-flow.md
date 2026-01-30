# Model Comparison Flow

A tutorial on how to use this repo to produce model comparison results

### Step 1 - Generate images from video

Open video_util.ipynb file inside the /notebooks folder. Provide the correct input video file name and run the script.

Should save images under 'D:\Magistrska\public\exercise-cut-videos-to-images\', copy the generated folder to 'D:\Magistrska\blindoff-magistrska\fitcode-frontend-next\public\exercise-cut-videos-to-images'. The folder should contain a .json file with filenames and extracted images inside the /images folder.

### Step 2 - Run models prediction on generated images

Run the frontend service with 'npm run dev' inside 'D:\Magistrska\blindoff-magistrska\fitcode-frontend-next'. Make sure the .env variable NEXT_PUBLIC_PREDICT_ON_FOLDER_WITH_IMAGES is set to 1.

Inside 'ai-image-detection-service.ts' set the correct folderUrl. You can skip some models with the skippableModels. If disableKeypointDrawing is set to false, it will also save the a .zip file containing images with keypoints on them.

Once ready for go to localhost http://localhost:3000/pose-model and open the console to track recognition progress.

For each model, it should download a json file with the predicted keypoints.

Once done, copy the json files into 'D:\Magistrska\blindoff-magistrska\fitcode-frontend-next\public\exercise-cut-videos-to-images\${video_name}\results'

### Step 3 - RTMO-X detection (Ground truth)

Open the 'rtmo.ipynb' notebook inside /notebooks. Go to the cell under the "Image Recognition" title and set the correct TITLE, INPUT_DIR and OUTPUT_DIR. Run the cell.

Should save a "RTMO_results.json" file under the /results folder inside the 'D:\Magistrska\blindoff-magistrska\fitcode-frontend-next\public\exercise-cut-videos-to-images\${video_name}\results' folder.

### Step 4 - Plot compared model results

Open the 'model-results-comparison.ipynb' file inside /notebooks. Go to the cell under the "Compare outputs of models based on groud truth from RTMO-X" title and set the correct TITLE and FOLDER_NAME. Run the cell.

Should save plots inside 'D:\Magistrska\blindoff-magistrska\fitcode-frontend-next\public\exercise-cut-videos-to-images\${video_name}\plots' folder.

### Cleanup

Delete the images inside 'D:\Magistrska\blindoff-magistrska\fitcode-frontend-next\public\exercise-cut-videos-to-images\${video_name}\images' folder, so they don't get commited and pushed to git. The images are still saved under 'D:\Magistrska\public\exercise-cut-videos-to-images'.