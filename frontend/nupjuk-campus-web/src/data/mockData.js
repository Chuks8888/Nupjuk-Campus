export const mockUsers = [{
  id: 'u1',
  kaist_email: 'student@kaist.ac.kr',  //
  display_name: 'Jaehyun Jeong',       //
  created_at: '2026-03-01T10:00:00Z'   //
}];

export const mockCourses = [
  {
    id: 'c1',
    course_code: 'CS350',                                 //
    course_name: 'Introduction to Software Engineering',  //
    semester: '2026 Spring',                              //
    klms_course_id: 'klms_12345'                          //
  },
  {
    id: 'c2',
    course_code: 'CS374',                                       //
    course_name: 'Introduction to Human-Computer Interaction',  //
    semester: '2026 Spring',                                    //
    klms_course_id: 'klms_67890'                                //
  }
];

export const mockEnrollments = [
  {
    user_id: 'u1',                        //
    course_id: 'c1',                      //
    verified_at: '2026-03-02T11:00:00Z',  //
    valid_until: '2026-06-30T23:59:59Z',  //
    status: 'active'                      //
  },
  {
    user_id: 'u1',                        //
    course_id: 'c2',                      //
    verified_at: '2026-03-02T11:05:00Z',  //
    valid_until: '2026-06-30T23:59:59Z',  //
    status: 'active'                      //
  }
];

export const mockAssignments = [{
  id: 'a1',
  course_id: 'c1',                        //
  title: 'Milestone 3: Design Document',  //
  due_date: '2026-05-22T23:59:59Z',       //
  description: 'Submit the final SRS.',   //
  source: 'klms_synced',                  //
  klms_submission_status: 'pending',      //
  user_completion_status: 'in_progress'   //
}];