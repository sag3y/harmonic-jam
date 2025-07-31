# Welcome to the Harmonic Fullstack Jam completed by Sage White! :D
Here is a write-up and video along with the code. 

Hi! I’m excited to be interviewing for a SWE role at Harmonic. Here are some changes I made to the existing code in order to get the job done:
- I created 4 new endpoints, 2 for adding/removing companies to a liked list and 2 for bulk-adding/removing companies to a liked list.
- I added the ability to favorite/unfavorite an individual company by clicking the star icon in the column.
- I added the ability to bulk add and remove favorites via buttons at the top of the table. These buttons are disabled if nothing is selected or the process is currently running.

### Optimizations
- Added a check to filter out duplicate companies before adding them to a collection.  
  Previously, if hundreds of companies already existed, the backend would attempt to re-insert them and check for conflicts hundreds of times.  
  Now it performs a quick DB query to find existing companies and only inserts the new ones in bulk.
- When a user likes or unlikes a single company, the UI instantly updates without waiting for the server.  
  Before, the app waited for the API call to finish and then refetched the list.  
  Now, the UI updates immediately, and if the API fails, the change is reverted.

### UI Changes
- Removed the old "Liked" column on the far left (used for testing but not functional).  
- Added a star column that is clickable for liking/unliking a company.

### Future Improvements
- Implement an asynchronous task processing pattern with status polling. A simple solution would be using Python threading for large transfers and an additional endpoint for the frontend to check background job status.



Video explanation:

https://github.com/user-attachments/assets/a93109c8-6ffb-415a-a092-0fee6d659477


https://github.com/user-attachments/assets/908abd63-6b49-4f5d-a868-5a4dc7a213cc




Enjoy :D
